var title = '迅驰';
var url = 'https://www.xc8j.com';
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
			type_name: '电影',
			filters: [{
				key: 'cateId',
				name: '类型',
				value: [{
						n: "动作片",
						v: "5"
					},
					{
						n: "爱情片",
						v: "6"
					},
					{
						n: "科幻片",
						v: "7"
					},
					{
						n: "恐怖片",
						v: "8"
					},
					{
						n: "战争片",
						v: "9"
					},
					{
						n: "喜剧片",
						v: "10"
					},
					{
						n: "纪录片",
						v: "11"
					},
					{
						n: "剧情片",
						v: "12"
					}
				]
			}]
		},
		{
			type_id: '2',
			type_name: '剧集',
			filters: [{
				key: 'cateId',
				name: '类型',
				value: [{
						n: "国产剧",
						v: "13"
					},
					{
						n: "香港剧",
						v: "14"
					},
					{
						n: "欧美剧",
						v: "15"
					},
					{
						n: "韩国剧",
						v: "16"
					},
					{
						n: "台湾剧",
						v: "25"
					},
					{
						n: "日本剧",
						v: "26"
					},
					{
						n: "泰国剧",
						v: "27"
					}
				]
			}]
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
	let reqUrl = url + `/xc/${tid}-${page}.html`;

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
	xiyueta('.fed-list-info.fed-part-rows li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('.fed-list-title').text().trim(),
			book_pic: xiyueta(this).find('a').attr('data-original').startsWith('http') ?
				xiyueta(this).find('a').attr('data-original') : url + xiyueta(this).find('a').attr(
					'data-original'),
			book_remarks: xiyueta(this).find('.fed-list-remarks').text()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.fed-page-info .fed-hide.fed-show-xs-inline').text().match(/\/(\d+)/) && parseInt(xiyueta('.fed-page-info .fed-hide.fed-show-xs-inline').text().match(/\/(\d+)/)[1])) || 999,
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
		book_pic: xiyueta('a').attr('data-original'),
		book_content: xiyueta('.fed-part-esan').text().trim(),
		book_director: xiyueta('.fed-col-md6').eq(1).text().trim(),
		book_actor: xiyueta('.fed-col-md6').eq(0).text().trim(),
		book_area: xiyueta('.fed-col-xs6').eq(1).text().trim(),
		book_year: xiyueta('.fed-col-xs6').eq(3).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.fed-tabs-btns').each(function() {
		if (!xiyueta(this).text().trim().includes('剧情介绍')) {
			tabs.push(xiyueta(this).text().trim());
		}
	});
	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta('.stui-content__playlist').eq(i).find('a').each(function() {
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

	const searchUrl = `${url}/search.php?page=${page}&searchword=${wd}&searchtype=`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.fed-list-info.fed-part-rows li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('.fed-list-title').text().trim(),
			book_pic: xiyueta(this).find('a').attr('data-original').startsWith('http') ?
				xiyueta(this).find('a').attr('data-original') : url + xiyueta(this).find('a').attr(
					'data-original'),
			book_remarks: xiyueta(this).find('.fed-list-remarks').text()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.fed-page-info .fed-hide.fed-show-xs-inline').text().match(/\/(\d+)/) && parseInt(xiyueta('.fed-page-info .fed-hide.fed-show-xs-inline').text().match(/\/(\d+)/)[1])) || 1,
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

	let now = getStrByRegex(/var now="(.*?)"/, html);
	return {
		content: !!now ? now : '',
		label: inReq.label
	};
}