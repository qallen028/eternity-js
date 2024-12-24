var title = '58动漫';
var url = 'http://www.ting38.com';
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
	xiyueta('.fed-pops-navbar li').each(function() {
		const href = xiyueta(this).find('a').attr('href');
		if (href && href.match(/.*\/(.*?)\.html/)) {
			classes.push({
				type_id: href.match(/.*\/(.*?)\.html/)[1],
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

	const reqUrl = url + `/search.php?page=${page}&searchtype=5&tid=${tid}`;
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
	xiyueta('.fed-list-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').eq(1).text(),
			book_pic: url + xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.fed-list-remarks').text()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.fed-page-info .fed-hide.fed-show-xs-inline').text().match(/\/(\d+)/) && parseInt(xiyueta('.fed-page-info .fed-hide.fed-show-xs-inline').text().match(/\/(\d+)/)[1])) || 999,
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
		book_pic: xiyueta('.fed-col-md3').eq(0).text().trim(),
		book_content: xiyueta('.fed-col-md3').eq(3).text().trim(),
		book_actor: xiyueta('.fed-col-md6--span').eq(0).text().trim(),
		book_director: xiyueta('.fed-col-md6--span').eq(1).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.nav-tabs li').each(function() {
		tabs.push(xiyueta(this).text().trim());
	});

	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.myui-content__list`).eq(i).find('li').each(function() {
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

	const searchUrl = `${url}/search.php?page=${page}&searchword=${wd}&searchtype=`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.fed-list-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').eq(1).text(),
			book_pic: url + xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.fed-list-remarks').text()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.fed-page-info .fed-hide.fed-show-xs-inline').text().match(/\/(\d+)/) && parseInt(xiyueta('.fed-page-info .fed-hide.fed-show-xs-inline').text().match(/\/(\d+)/)[1])) || 1,
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
	try {
		let match = html.match(/var now="([^"]+)"/);
		if (match) {
			content = match[1];
		}
	} catch (e) {}

	return {
		content: content,
		label: inReq.label,
		parse: /\.m3u8|\.mp4/.test(content) ? 0 : 1
	};
}