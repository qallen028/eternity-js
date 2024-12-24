var title = '天天影院';
var url = 'http://www.tvyb03.com';
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
	const classes = [{
			type_id: '1',
			type_name: '电影'
		},
		{
			type_id: '2',
			type_name: '电视剧'
		},
		{
			type_id: '3',
			type_name: '综艺'
		},
		{
			type_id: '4',
			type_name: '动漫'
		},
		{
			type_id: '16',
			type_name: '日韩剧'
		},
		{
			type_id: '13',
			type_name: '国产剧'
		},
		{
			type_id: '15',
			type_name: '欧美剧'
		},
		{
			type_id: '14',
			type_name: '港台剧'
		}
	];
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
	xiyueta('.myui-vodlist__box').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('.lazyload').attr('data-original'),
			book_remarks: xiyueta(this).find('.tag').text().trim()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.visible-xs a').text().match(/\/(\d+)/) && parseInt(xiyueta('.visible-xs a').text().match(/\/(\d+)/)[1])) || 999,
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
		book_content: xiyueta('.text-collapse span').text().trim(),
		book_actor: xiyueta('.data').eq(0).find('a').eq(2).text().trim(),
		book_director: xiyueta('.data').eq(0).find('a').eq(1).text().trim(),
		book_area: xiyueta('.data').eq(2).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.myui-panel__head h3').each(function() {
		const tab = xiyueta(this).text().trim();
		if (tab == '猜你喜欢') {
			return false;
		}
		if (tab != '热门资讯' && tab != '剧情简介' && tab != 'xunlei下载') {
			tabs.push(tab);
		}
	});

	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.myui-content__list`).eq(i).find('li').each(function() {
			let name = xiyueta(this).find('a').text();
			if(!name){
				name = tabs[i];
			}
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

	const searchUrl = `${url}/vod/search/page/${page}/wd/${wd}.html`;
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
			book_pic: xiyueta(this).find('.lazyload').attr('data-original'),
			book_remarks: xiyueta(this).find('.pic-text').text().trim()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.visible-xs a').text().match(/\/(\d+)/) && parseInt(xiyueta('.visible-xs a').text().match(/\/(\d+)/)[1])) || 1,
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
		let player = JSON.parse(html.match(/r player_.*?=(.*?)</)[1]);
		let playUrl = player.url;
		let from = player.from;

		if (player.encrypt == '1') {
			playUrl = unescape(playUrl);
		} else if (player.encrypt == '2') {
			playUrl = unescape(atob(playUrl));
		}

		if (/\.m3u8|\.mp4/.test(playUrl)) {
			content = playUrl;
		} else {
			let jx = await request(url + "/static/player/" + from + ".js");
			let jxUrl = jx.match(/ src="(.*?)'/)[1];
			let jxHtml = await request(jxUrl + playUrl, {
				headers: {
					'Referer': url
				}
			});
			let src = xiyueta.load(jxHtml)("#WANG").attr('src');
			if (src) {
				let srcHtml = await request(src, {
					headers: {
						'Referer': jxUrl + playUrl
					}
				});
				try {
					content = JSON.parse(srcHtml).url;
				} catch (e) {}
			}
		}
	} catch (e) {}

	return {
		content: content,
		label: inReq.label
	};
}