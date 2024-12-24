var title = '好乐';
var url = 'https://www.haolev.com';
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
			type_id: '1',
			type_name: '电影'
		},
		{
			type_id: '2',
			type_name: '电视剧'
		},
		{
			type_id: '4',
			type_name: '动漫'
		},
		{
			type_id: '3',
			type_name: '综艺'
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
	let reqUrl = url + '/haoshow/le' + tid;
	reqUrl += `--------${page}---.html`;
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
	xiyueta('.hl-vod-list li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('.hl-lazy').attr('data-original'),
			book_remarks: xiyueta(this).find('.hl-pic-text').text()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.hl-page-total').text().match(/\d+/g) && parseInt(xiyueta('.hl-page-total').text().match(/\d+/g)[1])) || 1,
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
		book_pic: xiyueta('.hl-lazy').attr('data-original'),
		book_content: xiyueta('.blurb').text().trim(),
	};

	// 获取播放列表
	let urls = [];
	// 获取播放列表
	let tabs = [];
	xiyueta('.hl-play-source').eq(0).find('.hl-plays-from').find('a').each(function() {
		const text = xiyueta(this).text().trim().replace(/&nbsp;/g, '');
		tabs.push(text);
	});
	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta('.hl-sort-list').eq(i).find('li').each(function() {
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

	const searchUrl = `${url}/haolesearch/${wd}----------${page}---.html`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.hl-one-list li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.hl-item-content p').first().text()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.hl-page-total').text().match(/\d+/g) && parseInt(xiyueta('.hl-page-total').text().match(/\d+/g)[1])) || 1,
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
		content: !!play_dic['url'] ? decodeURIComponent(play_dic['url']) : '',
		label: inReq.label
	};
}