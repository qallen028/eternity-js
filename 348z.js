var title = '348z';
var url = 'https://www.348z.com';
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
	xiyueta('#nav-bar li').each(function() {
		const href = xiyueta(this).find("a").attr('href');
		if (href && href.match(/\/(\d+)\.html/)) {
			classes.push({
				type_id: href.match(/\/(\d+)\.html/)[1],
				type_name: xiyueta(this).find("a").text().trim()
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

	const reqUrl = url + `/vodshow/id/${tid}/page/${page}.html`;
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
	xiyueta('.list-a li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('.eclazy').attr('data-original'),
			book_remarks: ''
		});
	})
	return {
		page: page,
		pagecount: (xiyueta('.page_tip').find("a").text().trim().split('&nbsp;/&nbsp;') && parseInt(xiyueta(
			'.page_tip').find("a").text().trim().split('&nbsp;/&nbsp;')[1])) || 1,
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
		book_name: xiyueta('h2').text().trim(),
		book_pic: xiyueta('.eclazy').eq(0).attr('data-original'),
		book_content: xiyueta('.ecshow').text().trim(),
		book_actor: '',
		book_director: '',
		book_area: ''
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('#tag a').each(function() {
		let tab = xiyueta(this).text().trim()
			.replace(/\s*\([^)]*\)/, '')
			.replace(/[^\x00-\x7F]/, '');
		if (!['蓝光Z', '极速', '极速2'].includes(tab)) {
			tabs.push(tab);
		}
	});
	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.playlist_notfull`).eq(i).find('li').each(function() {
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

	const searchUrl = `${url}/vodsearch/page/${page}/wd/${wd}.html`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.searchlilst li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('.eclazy').attr('data-original'),
			book_remarks: ''
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.page_tip').find("a").text().trim().split('&nbsp;/&nbsp;') && parseInt(xiyueta(
			'.page_tip').find("a").text().trim().split('&nbsp;/&nbsp;')[1])) || 1,
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
		if (player.encrypt == '1') {
			playUrl = unescape(playUrl);
		} else if (player.encrypt == '2') {
			playUrl = unescape(atob(playUrl));
		}

		if (/\.m3u8/.test(playUrl)) {
			const m3u8 = await request(playUrl);
			const lines = m3u8.split('\n');
			for (let line of lines) {
				line = line.trim();
				if (line.endsWith('.m3u8')) {
					playUrl = new URL(line, playUrl).href;
					break;
				}
			}
		}
		content = playUrl;
	} catch (e) {}

	return {
		content: content,
		label: inReq.label,
		parse: 0
	};
}