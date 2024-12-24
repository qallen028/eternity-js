var title = '美星';
var url = 'https://mxvod.com';
var ajax_timeout = 60 * 1000;

// 请求方法
async function request(reqUrl) {
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Ghxi Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/76.0.3809.89 Mobile Safari/537.36',
			'referer': 'https://mxvod.com/'
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
			type_id: 'guochanju',
			type_name: '国产剧'
		},
		{
			type_id: 'hanju',
			type_name: '韩剧'
		},
		{
			type_id: 'guochandongman',
			type_name: '国产动漫'
		},
		{
			type_id: 'dsj',
			type_name: '电视剧'
		},
		{
			type_id: 'dianying',
			type_name: '电影'
		},
		{
			type_id: 'dongman',
			type_name: '动漫'
		},
		{
			type_id: 'zongyi',
			type_name: '综艺'
		},
		{
			type_id: 'jilupian',
			type_name: '纪录片'
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

	const reqUrl = url + `/vodshow/${tid}--------${page}---/`;
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
	xiyueta('.module-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: url + xiyueta(this).find('img').attr('data-src'),
			book_remarks: xiyueta(this).find('.video-class').text().trim()
				.replace(/更新至第/g, '')
				.replace(/更新第/g, '')
				.replace(/每集/g, '')
		});
	})

	return {
		page: page,
		pagecount: parseInt(xiyueta('.page-number.page-next[title="尾页"]').attr('href').match(/--------(\d+)---/)[
			1]),
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
		book_content: xiyueta('.txtone.container').text().trim(),
		book_actor: xiyueta('meta[property="og:video:actor"]').attr('content')
			.replace(/&nbsp;/g, '')
			.replace(/<span class="slash">/g, '')
			.replace(/<br>/g, ''),
		book_director: '',
		book_area: xiyueta('.module-info-tag-link').text().trim()
			.replace(/剧情/g, '电视剧')
			.replace(/<span class="slash">/g, '')
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.tab-item').each(function() {
		const tab = xiyueta(this).find("span").text().trim();
		if (!tab.includes('剧情介绍')) {
			tabs.push(tab);
		}
	});
	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.module-blocklist`).eq(i).find('a').each(function() {
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

	const searchUrl = page > 1 ? `${url}/vodsearch/${wd}----------${page}---.html` :
		`${url}/vodsearch/-------------/?wd=${wd}`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.module-search-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('img').attr('alt'),
			book_pic: url + xiyueta(this).find('img').attr('data-src'),
			book_remarks: xiyueta(this).find('.video-serial').text().trim()
				.replace(/更新至第/g, '')
				.replace(/更新第/g, '')
				.replace(/每集/g, '')
		});
	})
	return {
		page: page,
		pagecount: parseInt(xiyueta('.page-number.page-next[title="尾页"]').attr('href').match(
			/vodsearch\/.*?----------(\d+)---/)[1]),
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
		content: !!play_dic['url'] ? play_dic['url'] : '',
		label: inReq.label
	};
}