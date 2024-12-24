var title = '查虎玩';
var url = 'https://www.5jcd.com';
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

	const reqUrl = url + `/show_/id/${tid}/page/${page}.html`;
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
	xiyueta('.myui-vodlist li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.text-muted').text().trim()
		});
	})

	return {
		page: page,
		pagecount: parseInt(xiyueta('.myui-page .visible-xs .btn').text().split('/')[1]),
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
		book_pic: xiyueta('.module-item-pic img').attr('data-src'),
		book_content: xiyueta('.col-pd').text().trim(),
		book_actor: xiyueta('.module-info-item').eq(2).text().trim(),
		book_director: xiyueta('.module-info-item').eq(1).text().trim(),
		book_area: xiyueta('.module-info-item').eq(3).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.myui-content__list').parent().prev('.myui-panel_hd').find('h3').each(function() {
		const text = xiyueta(this).text().trim();
		tabs.push(xiyueta(this).text().trim());
	});

	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta('.myui-content__list').eq(i).find('a').each(function() {
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

	const searchUrl = `${url}/sou/page/${page}/wd/${wd}.html`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('#searchList .clearfix').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.text-muted').text().trim()
		});
	})

	return {
		page: page,
		pagecount: parseInt(xiyueta('.myui-page .visible-xs .btn').text().split('/')[1]),
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
		label: inReq.label,
		parse: 1
	};
}