var title = '飞快';
var url = 'https://feikuai.tv';
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
	xiyueta('.navbar-items li').slice(1, 10).each(function() {
		const href = xiyueta(this).find('a').attr('href');
		if (href && href.match(/\/vodtype\/(\d+)\.html/) != null) {
			const type_id = href.match(/\/vodtype\/(\d+)\.html/)[1];
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

	let reqUrl = url + `/vodshow/${tid}--------${page}---.html`;

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
			book_name: xiyueta(this).attr('title').trim(),
			book_pic: xiyueta(this).find('img').attr('data-original'),
			book_remarks: xiyueta(this).find('.module-poster-item-title').text().trim()
		});
	})
	return {
		page: page,
		pagecount: xiyueta('a[title="尾页"]').attr('href').match(/vodshow\/\d+\-+(\d+)\-+\.html/) ?
			xiyueta('a[title="尾页"]').attr('href').match(/vodshow\/\d+\-+(\d+)\-+\.html/)[1] : 999,
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
		book_name: xiyueta('.page-title').text().trim(),
		book_pic: xiyueta('.module-item-pic img').attr('data-src'),
		book_content: xiyueta('.module-info-introduction-content').text().trim(),
		book_director: xiyueta('.module-info-item').eq(1).text().trim(),
		book_actor: xiyueta('.module-info-item').eq(2).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('#y-playList .tab-item').each(function() {
		tabs.push(xiyueta(this).attr('data-dropdown-value').trim());
	});
	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.module-play-list`).eq(i).find('a').each(function() {
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

	const searchUrl = `${url}/vodsearch/${wd}----------${page}---.html`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.module-items .module-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('strong').text().trim(),
			book_pic: xiyueta(this).find('img').attr('data-original'),
			book_remarks: xiyueta(this).find('.module-info-item-content').text().trim()
		});
	})

	return {
		page: page,
		pagecount: xiyueta('a[title="尾页"]').attr('href').match(/vodsearch\/.*?(\d+)\-+\.html/) ?
			xiyueta('a[title="尾页"]').attr('href').match(/vodsearch\/.*?(\d+)\-+\.html/)[1] : 999,
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

	let player_str = getStrByRegex(/<script type="text\/javascript">var player_aaaa=(.*?)<\/script>/, html);
	let play_dic = JSON.parse(player_str);

	return {
		content: !!play_dic['url'] ? decodeURIComponent(atob(play_dic['url'])) : '',
		label: inReq.label,
		parse: 1
	};
}