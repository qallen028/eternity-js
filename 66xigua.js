var title = '66西瓜';
var url = 'https://www.ledlmw.com';
var ajax_timeout = 1000 * 60;

// 请求方法
async function request(reqUrl) {
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': MOBILE_UA
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
	xiyueta('.myui-header__menu .dropdown-box li').slice(1, 7).each(function() {
		const href = xiyueta(this).find('a').attr('href');
		if (href && href.match(/.*\/(.*?)\.html/) != null) {
			const type_id = href.match(/.*\/(.*?)\.html/)[1];
			if (type_id != '明星') {
				classes.push({
					type_id: type_id,
					type_name: xiyueta(this).find('a').text().trim()
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

	const reqUrl = url + `/${tid}-${page}.html`;
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
	xiyueta('.myui-vodlist li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.pic-text').text().trim()
		});
	})

	return {
		page: page,
		pagecount: parseInt(xiyueta('.myui-page li:last a').attr('href').match(/sx-1-(\d+)\.html/)[1]),
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
		book_name: xiyueta('h1').text().trim(),
		book_pic: xiyueta('.lazyload').attr('src'),
		book_content: xiyueta('.content').text().trim(),
		book_year: xiyueta('.text-muted').eq(-5).text().trim(),
		book_area: xiyueta('.myui-content__detail p').eq(4).text().trim(),
		book_actor: xiyueta('.myui-content__detail p').eq(5).text().trim(),
		book_director: xiyueta('.myui-content__detail p').eq(6).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.nav.nav-tabs a').each(function() {
		const tab = xiyueta(this).text().trim();
		if (!tab.includes('类型') && !tab.includes('年份') && !tab.includes('TAG')) {
			tabs.push(tab);
		}
	});

	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.myui-content__list`).eq(i).find('li').each(function() {
			const name = xiyueta(this).text().trim();
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

	const searchUrl = `${url}/baidu${wd}/page/${page}.html`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.myui-vodlist__media li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.detail p').eq(2).text().trim()
		});
	})
	return {
		page: page,
		pagecount: parseInt(xiyueta('.myui-page li:last a').attr('href').match(/\/page\/(\d+)\.html/)[1]),
		list: books,
	};
}

// 播放内容
async function play(inReq) {
	const id = inReq.id;
	const html = await request(url + id);
	if (html === null) {
		return {
			content: "",
			label: ""
		};
	}
	
	// 提取视频地址
	let content = '';
	let player_str = getStrByRegex(/<script type="text\/javascript">var player_aaaa=(.*?)<\/script>/, html);
	let play_dic = JSON.parse(player_str);
	return {
		content: !!play_dic['url'] ? play_dic['url'] : '',
		label: inReq.label
	};
}