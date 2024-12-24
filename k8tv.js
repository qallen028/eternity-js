var title = 'k8tv';
var url = 'http://k8.8itv.cn';
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
	xiyueta('.hl-nav.hl-text-site li').each(function() {
		const href = xiyueta(this).find('a').attr('href');
		const name = xiyueta(this).find('a').text().trim();
		if (href && href.match(/.*\/(.*)\.html/) != null && name != '体育') {
			const type_id = href.match(/.*\/(.*)\.html/)[1];
			classes.push({
				type_id: type_id,
				type_name: name
			});
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

	// 构建筛选URL
	let reqUrl = url + `/index.php/vod/show/id/${tid}/page/${page}.html`;

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
	xiyueta('.hl-vod-list.clearfix li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.hl-pic-text').text()
		});
	})
	return {
		page: page,
		pagecount: xiyueta('.hl-page-tips').find('a').text().split('/&nbsp;')[1] ?
			xiyueta('.hl-page-tips').find('a').text().split('/&nbsp;')[1] : 999,
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
		book_name: xiyueta('.hl-full-box.clearfix ul li').eq(0).text().trim(),
		book_pic: xiyueta('.hl-full-box.clearfix ul li').eq(2).text().trim(),
		book_content: xiyueta('.hl-full-box.clearfix ul li').eq(12).text().trim(),
		book_director: xiyueta('.hl-full-box.clearfix ul li').eq(5).text().trim(),
		book_actor: xiyueta('.hl-full-box.clearfix ul li').eq(6).text().trim(),
		book_area: xiyueta('.hl-full-box.clearfix ul li').eq(3).text().trim(),
		book_year: xiyueta('.hl-full-box.clearfix ul li').eq(4).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.hl-tabs-btn.hl-slide-swiper').each(function() {
		tabs.push(xiyueta(this).attr('alt'));
	});
	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`#hl-plays-list`).eq(i).find('a').each(function() {
			const name = xiyueta(this).text();
			const link = xiyueta(this).attr('href');
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

	const searchUrl = `${url}/index.php/vod/search.html?wd=${wd}&submit=`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.hl-item-div').each(function() {
		books.push({
			book_id: xiyueta(this).find('.hl-item-pic a').attr('href'),
			book_name: xiyueta(this).find('.hl-item-content a').attr('title'),
			book_pic: xiyueta(this).find('.hl-item-pic a').attr('data-original'),
			book_remarks: xiyueta(this).find('.hl-item-pic span').text()
		});
	})

	return {
		page: 1,
		pagecount: 1,
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

	let content = '';
	let player_str = getStrByRegex(/<script type="text\/javascript">var player_aaaa=(.*?)<\/script>/, html);
	let play_dic = JSON.parse(player_str);

	return {
		content: !!play_dic['url'] ? decodeURIComponent(play_dic['url']) : '',
		label: inReq.label,
		parse: 1
	};
}