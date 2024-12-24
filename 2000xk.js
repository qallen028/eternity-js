var title = '2000xk';
var url = 'http://2000xk.com';
var ajax_timeout = 60 * 1000;

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
	xiyueta('.type-slide li').each(function() {
		const href = xiyueta(this).find('a').attr('href');
		if (href && href.match(/.*\/(.*?)\.html/) != null) {
			const type_id = href.match(/.*\/(.*?)\.html/)[1];
			classes.push({
				type_id: type_id,
				type_name: xiyueta(this).find('a').text().trim()
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
	let reqUrl = url + `/hd/${tid}/page/${page}.html`;

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
			book_pic: xiyueta(this).find('.lazyload').attr('data-original'),
			book_remarks: xiyueta(this).find('.pic-text').text()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.stui-page .visible-xs .num').text().match(/\/(\d+)/) && parseInt(xiyueta('.stui-page .visible-xs .num').text().match(/\/(\d+)/)[1])) || 999,
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
		book_pic: xiyueta('.lazyload').attr('data-original'),
		book_content: xiyueta('.detail-content').text().trim()
	};

	// 获取播放列表

	let tabs = [];
	xiyueta('.bottom-line:has(span)').each(function() {
		tabs.push(xiyueta(this).text().trim());
	});
	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.stui-content__playlist`).eq(i).find('a').each(function() {
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
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;

	const searchUrl = `${url}/vod/search/page/${page}/wd/${wd}.html`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.stui-vodlist__media li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('.lazyload').attr('data-original'),
			book_remarks: xiyueta(this).find('.pic-text').text()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.stui-page .visible-xs .num').text().match(/\/(\d+)/) && parseInt(xiyueta('.stui-page .visible-xs .num').text().match(/\/(\d+)/)[1])) || 1,
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
		content: !!play_dic['url'] ? decodeURIComponent(atob(play_dic['url'])) : '',
		label: inReq.label
	};
}