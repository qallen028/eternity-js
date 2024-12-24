var title = '4K聚源';
var url = 'https://www.4k4k.live';
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
			book_name: xiyueta(this).attr('title'),
			book_pic: xiyueta(this).find('img').attr('data-original'),
			book_remarks: xiyueta(this).find('.module-item-note').text()
		});
	})
	return {
		page: page,
		pagecount: (xiyueta('.page-link.page-next[title="尾页"]').attr('href').match(/\d+/g) && parseInt(xiyueta('.page-link.page-next[title="尾页"]').attr('href').match(/\d+/g)[1])) || 1,
		list: books,
	};
}

// 获取详情
async function detail(inReq) {
	const id = inReq.id;
	const html = await request(url + (typeof id === 'string' && id.startsWith('/voddetail/') ? id : '/voddetail/' + id));
	if (html === null) {
		return {
			list: []
		};
	}

	xiyueta.load(html);
	let book = {
		book_name: xiyueta('h1').text().trim(),
		book_pic: xiyueta('.module-item-pic img').attr('data-src'),
		book_content: xiyueta('.module-info-introduction-content').text().trim(),
		book_actor: xiyueta('.module-info-item').eq(4).text().trim(),
		book_director: xiyueta('.module-info-item-content').eq(1).text().trim(),
		book_area: xiyueta('.module-info-item-content').eq(0).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.module-tab-item span').each(function() {
		tabs.push(xiyueta(this).text().trim());
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
	const searchUrl = `${url}/index.php/ajax/suggest?mid=1&wd=${wd}&limit=100`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	let books = [];
	let jo = JSON.parse(JSON.stringify(html));
	jo.list.forEach(item => {
		books.push({
			book_id: item.id,
			book_name: item.name,
			book_pic: item.pic,
			book_remarks: ''
		});
	});

	return {
		page: 1,
		pagecount: 1,
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
		content = playUrl;
	} catch(e) {}

	return {
		content: content,
		label: inReq.label,
		parse: /\.m3u8|\.mp4/.test(content) ? 0 : 1
	};
} 