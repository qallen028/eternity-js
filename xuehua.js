var title = '雪花';
var url = 'https://www.xgitv.com';
var ajax_timeout = 60 * 1000;

// 请求方法
async function request(reqUrl) {
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': UC_UA,
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
			type_id: 'dianying',
			type_name: '电影'
		},
		{
			type_id: 'dianshiju',
			type_name: '剧集'
		},
		{
			type_id: 'zongyi',
			type_name: '综艺'
		},
		{
			type_id: 'dongman',
			type_name: '动漫'
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

	// 构建筛选URL
	let reqUrl = url + '/vshow/' + tid + '--------' + page + '---.html';
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
	xiyueta('.hl-list-wrap .hl-list-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('.hl-item-thumb').attr('href'),
			book_name: xiyueta(this).find('.hl-item-title a').text().trim(),
			book_pic: url + xiyueta(this).find('.hl-item-thumb').attr('data-original'),
			book_remarks: xiyueta(this).find('.hl-pic-text .remarks').text().trim()
		});
	});
	return {
		page: page,
		pagecount: parseInt(xiyueta('.hl-page-wrap .hl-page-tips a').text().split('&nbsp;/&nbsp;')[1]) || 999,
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
		book_name: xiyueta('.hl-dc-title').text().trim(),
		book_pic: url + xiyueta('.hl-item-thumb').attr('data-original'),
		book_content: xiyueta('.hl-text-muted').text().trim(),
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.hl-plays-from .hl-tabs-btn').each(function() {
		const text = xiyueta(this).text().trim().replace(/&nbsp;/g, '');
		tabs.push(text);
	});

	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta('.hl-plays-list').eq(i).find('a').each(function() {
			const name = xiyueta(this).text().trim();
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
	const searchUrl = `${url}/vsearch/${wd}----------${page}---.html`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.hl-list-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('.hl-item-thumb').attr('href'),
			book_name: xiyueta(this).find('.hl-item-title a').text().trim(),
			book_pic: url + xiyueta(this).find('.hl-item-thumb').attr('data-original'),
			book_remarks: xiyueta(this).find('.hl-pic-text .remarks').text().trim()
		});
	});

	return {
		page: page,
		pagecount: parseInt(xiyueta('.hl-page-wrap .hl-page-tips a').text().split('&nbsp;/&nbsp;')[1]) || 1,
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

	let player_str = getStrByRegex(/var player_aaaa=(.*?)<\/script>/, html);
	let play_dic = JSON.parse(player_str);
	return {
		content: play_dic['url'] ? decodeURIComponent(play_dic['url']) : '',
		label: inReq.label
	};
}