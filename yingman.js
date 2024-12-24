var title = '影音先锋';
var url = 'https://skr.skr2.cc:666';
var ajax_timeout = 60 * 1000;

// 请求方法
async function request(reqUrl) {
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': UC_UA
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
			type_id: '47',
			type_name: '国漫'
		},
		{
			type_id: '85',
			type_name: '美漫'
		},
		{
			type_id: '46',
			type_name: '日漫'
		},
		{
			type_id: '81',
			type_name: '国剧'
		},
		{
			type_id: '82',
			type_name: '港台'
		},
		{
			type_id: '32',
			type_name: '日剧'
		},
		{
			type_id: '88',
			type_name: '纪录片'
		},
		{
			type_id: '91',
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
	let reqUrl = url + `/vodshow/${tid}--------${page}---/`;

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
	xiyueta('.vodlist li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('.lazyload').attr('data-original'),
			book_remarks: xiyueta(this).find('.pic_text.text_right').text()
		});
	})
	return {
		page: page,
		pagecount: (xiyueta('.page_tips').text().match(/共有(\d+)页/) && parseInt(xiyueta('.page_tips').text().match(/共有(\d+)页/)[1])) || 999,
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
		book_content: xiyueta('.content_desc.full_text').text().trim(),
		book_director: xiyueta('.content_min li').eq(1).text().trim(),
		book_actor: xiyueta('.content_min li').eq(0).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.play_source_tab a').each(function() {
		tabs.push(xiyueta(this).text().replace('&#xe62f;&nbsp;', ''));
	});
	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.content_playlist`).eq(i).find('a').each(function() {
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

	const searchUrl = `${url}/vodsearch/${wd}----------${page}---/`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.searchlist_item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('.vodlist_title').text().trim(),
			book_pic: xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.voddate').text().trim()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.page_tips').text().match(/共有(\d+)页/) && parseInt(xiyueta('.page_tips').text().match(/共有(\d+)页/)[1])) || 1,
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