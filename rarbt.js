var title = 'rarbt';
var url = 'https://www.rarbt.fun';
var ajax_timeout = 5000;

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
	xiyueta('.navbar-items li').slice(1, 10).each(function() {
		const href = xiyueta(this).find('a').attr('href');
		if (href && href.match(/type\/(.*?)\.html/)) {
			classes.push({
				type_id: href.match(/type\/(.*?)\.html/)[1],
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

	const reqUrl = url + `/vod/show/id/${tid}/page/${page}.html`;
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
	xiyueta('.module-items .module-item').each(function() {
		books.push({
			book_id: xiyueta(this).attr('href'),
			book_name: xiyueta(this).attr('title'),
			book_pic: xiyueta(this).find('.lazyloaded').attr('data-original'),
			book_remarks: xiyueta(this).find('.module-poster-item-info').text().trim()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.page-link.page-next[title="尾页"]').attr('href') && xiyueta(
			'.page-link.page-next[title="尾页"]').attr('href').match(/page\/(\d+)\.html/)) ? xiyueta(
			'.page-link.page-next[title="尾页"]').attr('href').match(/page\/(\d+)\.html/)[1] : 999,
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
		book_pic: xiyueta('img.ls-is-cached').attr('data-original'),
		book_content: xiyueta('.show-desc').text().trim(),
		book_director: xiyueta('.module-info-item-content').eq(0).text().trim(),
		book_actor: xiyueta('.module-info-item-content').eq(2).text().trim(),
		book_area: xiyueta('.module-info-tag-link').eq(1).text().trim(),
		book_year: xiyueta('.module-info-tag-link').eq(0).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.tab-item span').each(function() {
		tabs.push('在线-' + xiyueta(this).text().trim());
	});

	let fromUrls = [];
	let i = 0;
	let j = 0;
	tabs.forEach(tab => {
		if (/在线/.test(tab)) {
			let urls = [];
			xiyueta('.module-play-list').eq(i).find('a').each(function() {
				const name = xiyueta(this).text().trim();
				const link = xiyueta(this).attr('href');
				urls.push(name + '$' + link);
			});
			i++;
			fromUrls.push(urls.join('#'));
		}
	});

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
	xiyueta('body .module-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('.module-card-item-title').text().trim(),
			book_pic: xiyueta(this).find('.lazyload').attr('data-original'),
			book_remarks: xiyueta(this).find('.module-item-note').text().trim(),
			book_actor: xiyueta(this).find('.module-info-item-content').text().trim()
		});
	})

	try {
		return {
			page: page,
			pagecount: (xiyueta('a[title="尾页"]').attr('href').match(/\/page\/(\d+)/) && parseInt(xiyueta(
				'a[title="尾页"]').attr('href').match(/\/page\/(\d+)/)[1])) || 1,
			list: books,
		};
	} catch (error) {
		return {
			page: page,
			pagecount: 1,
			list: books,
		};
	}
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
	let player_str = getStrByRegex(/<script type="text\/javascript">var player_play=(.*?)<\/script>/, html);
	let play_dic = JSON.parse(player_str);
	return {
		content: !!play_dic['url'] ? decodeURIComponent(play_dic['url']) : '',
		label: inReq.label
	};
}