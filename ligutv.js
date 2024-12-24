var title = '梨果TV';
var url = 'https://www.ligutv.com';
var ajax_timeout = 1000 * 60;

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
			type_name: '动漫'
		},
		{
			type_id: '4',
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
	let reqUrl = url + `/vodtype/${tid}-${page}.html`;

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
			book_pic: xiyueta(this).find('a').attr('data-original'),
			book_remarks: xiyueta(this).find('.remarks').text()
		});
	})

	return {
		page: page,
		pagecount: xiyueta('.hl-page-tips').find('a').text().split('/&nbsp;')[1] ?
			xiyueta('.hl-page-tips').find('a').text().split('/&nbsp;')[1] : 999,
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
		book_content: xiyueta('.hl-content-text').text().trim(),
		book_director: xiyueta('.hl-dc-content li').eq(10).text().trim(),
		book_actor: xiyueta('.hl-dc-content li').eq(4).text().trim(),
		book_area: xiyueta('.hl-dc-content li').eq(2).text().trim(),
		book_year: xiyueta('.hl-dc-content li').eq(3).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.hl-tabs a').each(function() {
		tabs.push(xiyueta(this).find('span').text().trim());
	});
	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.hl-plays-list`).eq(i).find('li').each(function() {
			const name = xiyueta(this).text();
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

	const searchUrl = `${url}/vodsearch/${wd}----------${page}---.html`;
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
			book_remarks: xiyueta(this).find('.hl-list-item p').first().text()
		});
	})

	return {
		page: page,
		pagecount: xiyueta('.hl-page-total').text().match(/共\s*(\d+)\s*页/) ?
			xiyueta('.hl-page-total').text().match(/共\s*(\d+)\s*页/)[1] : 999,
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
	let player_str = getStrByRegex(/<script type="text\/javascript">var player_aaaa=(.*?)<\/script>/, html);
	let play_dic = JSON.parse(player_str);
	let player_html = await request(`https://data.m3u8.in/?url=${play_dic.url}&from=${play_dic.from}`);
	let sign = getStrByRegex(/const Sign = "(.*?)";/, player_html);
	let apiUrl = `https://data.m3u8.in/api.php?url=${play_dic.url}&sign=${sign}&form=${play_dic.from}`;
	let apiResp = await request(apiUrl);
	if (apiResp && apiResp.code == 200) {
		content = apiResp.url;
	}
	return {
		content: content,
		label: inReq.label,
		parse: 1,
		js: 'document.querySelector("#playleft iframe").contentWindow.document.querySelector("#start").click()'
	};
}