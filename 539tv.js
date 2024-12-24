var title = '539tv';
var url = 'https://539539.xyz';
var ajax_timeout = 60 * 1000;

// 请求方法
async function request(reqUrl) {
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': IOS_UA
		}
	})
	if (resp.status == 200) {
		return resp.data;
	} else {
		return null;
	}
}

// 获取分类
async function home() {
	const html = await request(url);
	if (html === null) {
		return {
			class: []
		};
	}

	xiyueta.load(html);
	let classes = [];
	xiyueta('.stui-header__menu li').each(function() {
		const href = xiyueta(this).find('a').attr('href');
		if (href && href.match(/.*\/(\d+)\.html/)) {
			const type_id = href.match(/.*\/(\d+)\.html/)[1];
			const type_name = xiyueta(this).find('a').text().trim();
			if (type_name != '伦理') {
				classes.push({
					type_id: type_id,
					type_name: type_name
				});
			}
		}
	});

	return {
		class: classes
	};
}

// 获取列表
async function category(inReq) {
	const tid = inReq.id;
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;

	const reqUrl = url + `/vodtype/${tid}/page/${page}.html`;
	const html = await request(reqUrl);
	if (html === null) {
		return {
			page: 1,
			pagecount: 0,
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.stui-vodlist li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.pic-text').text().trim()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.stui-page .num').text().trim().match(/\/(\d+)/) && parseInt(xiyueta('.stui-page .num').text().trim().match(/\/(\d+)/)[1])) || 999,
		list: books,
	};
}

// 获取详情
async function detail(inReq) {
	const id = inReq.id;
	const html = await request(url + id);
	if (html === null) {
		return {
			list: []
		};
	}

	xiyueta.load(html);
	let book = {
		book_name: xiyueta('.stui-content__detail .title').text().trim(),
		book_pic: xiyueta('.stui-content__thumb .lazyload').attr('data-original'),
		book_content: xiyueta('.detail').text().trim(),
		book_actor: xiyueta('.stui-content__detail p').eq(0).text().trim(),
		book_director: xiyueta('.stui-content__detail p').eq(1).text().trim(),
		book_area: xiyueta('.stui-content__detail p').eq(2).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.dropdown-menu a').each(function() {
		tabs.push(xiyueta(this).text().trim());
	});

	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.stui-content__playlist`).eq(i).find('li').each(function() {
			const name = xiyueta(this).find('a').text();
			const link = xiyueta(this).find('a').attr('href');
			urls.push(name + '$' + link);
		});
		fromUrls.push(urls.join('#'))
	}

	book.froms = tabs.join('$$$');
	book.urls = fromUrls.join('$$$');
	return {
		list: [book]
	};
}

// 搜索功能
async function search(inReq) {
	const wd = inReq.wd;
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;

	const searchUrl = `${url}/vodsearch/wd/${wd}/page/${page}.html`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.stui-vodlist li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.pic-text').text().trim()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.active .num').text().trim().match(/\/(\d+)/) && parseInt(xiyueta('.active .num').text().trim().match(/\/(\d+)/)[1])) || 1,
		list: books,
	};
}

// 播放内容
async function play(inReq) {
	let id = inReq.id;
	const html = await request(url + id);
	if (html === null) {
		return {
			content: "",
			label: ""
		};
	}
	let player_str = getStrByRegex(/<script type="text\/javascript">var player_aaaa=(.*?)<\/script>/, html);
	let play_dic = JSON.parse(player_str);
	return {
		content: !!play_dic['url'] ? play_dic['url'] : '',
		label: inReq.label
	};
}