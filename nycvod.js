var title = '纽约影院';
var url = 'https://tv.nycvod.com';
var ajax_timeout = 60 * 1000;

// 请求方法
async function request(reqUrl) {
	log(reqUrl);
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
			type_name: '電影'
		},
		{
			type_id: '2',
			type_name: '電視劇'
		},
		{
			type_id: '3',
			type_name: '綜藝'
		},
		{
			type_id: '4',
			type_name: '動漫'
		},
		{
			type_id: '50',
			type_name: '短劇'
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
	xiyueta('.module-poster-item').each(function() {
		books.push({
			book_id: xiyueta(this).attr('href'),
			book_name: xiyueta(this).find('.module-poster-item-title').text().trim(),
			book_pic: url + xiyueta(this).find('.lazy').attr('data-original'),
			book_remarks: xiyueta(this).find('.module-item-note').text().trim()
		});
	});
	return {
		page: page,
		pagecount: parseInt(xiyueta('[title="尾页"]').attr("href").match(/--------(\d+)---\.html/)[1]) || 999,
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
		book_pic: url + xiyueta('.module-item-pic img').eq(0).attr('data-src'),
		book_content: xiyueta('.module-info-introduction-content').text().trim(),
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('#y-playList .tab-item').each(function() {
		tabs.push(xiyueta(this).attr('data-dropdown-value').trim());
	});

	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta('.module-play-list').eq(i).find('a').each(function() {
			const name = xiyueta(this).text().trim();
			const link = xiyueta(this).attr('href');
			urls.push(name + '$' + link);
		});
		fromUrls.push(urls.join('#'));
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
	xiyueta('.module-card-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('.module-card-item-title a').attr('href'),
			book_name: xiyueta(this).find('.module-card-item-title strong').text().trim(),
			book_pic: url + xiyueta(this).find('.module-item-pic .lazy').attr('data-original'),
			book_remarks: xiyueta(this).find('.module-item-note').text().trim()
		});
	});
	return {
		page: page,
		pagecount: (!!xiyueta('[title="尾页"]').attr("href") && xiyueta('[title="尾页"]').attr("href").match(
			/--------(\d+)---\.html/)) ? parseInt(xiyueta('[title="尾页"]').attr("href").match(
			/--------(\d+)---\.html/)[1]) : 1,
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