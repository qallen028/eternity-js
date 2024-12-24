var title = '看影';
var url = 'https://www.kanying.me';
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
			type_name: '剧集'
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
	let reqUrl = url + `/so/${tid}/-------${page}---/`;

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
			book_pic: xiyueta(this).find('.lazyload').attr('data-original').startsWith('http') ?
				xiyueta(this).find('.lazyload').attr('data-original') : url + xiyueta(this).find(
					'.lazyload').attr('data-original'),
			book_remarks: xiyueta(this).find('.pic-text').text()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.visible-xs').find('a').text().match(/\/(\d+)/) && parseInt(xiyueta('.visible-xs')
			.find('a').text().match(/\/(\d+)/)[1])) || 999,
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
		book_pic: xiyueta('.lazyload').attr('src'),
		book_content: xiyueta('.content').text().trim(),
		book_director: xiyueta('.myui-content__detail p').eq(4).text().trim(),
		book_actor: xiyueta('.myui-content__detail p').eq(5).text().trim(),
		book_area: xiyueta('.text-muted').eq(-5).text().trim(),
		book_year: xiyueta('.text-muted').eq(-1).text().trim()
	};

	// 获取播放列表
	let tabs = [];
	xiyueta('.nav.nav-tabs a').each(function() {
		const tab = xiyueta(this).text().trim();
		if (!tab.includes('同类型') && !tab.includes('同主演') && !tab.includes('同TAG')) {
			tabs.push(tab);
		}
	});
	let fromUrls = [];
	for (let i = 0; i < tabs.length; i++) {
		let urls = [];
		xiyueta(`.myui-content__list`).eq(i).find('li').each(function() {
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

	const searchUrl = `${url}/search/${wd}----------${page}---/`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.myui-vodlist__media li').each(function() {
		if (typeof xiyueta(this).find('.lazyload').attr('data-original') == 'undefined') {
			books.push({
				book_id: xiyueta(this).find('a').attr('href'),
				book_name: xiyueta(this).find('a').attr('title'),
				book_pic: '',
				book_remarks: xiyueta(this).find('.detail p').eq(2).text().trim()
			});
		} else {
			books.push({
				book_id: xiyueta(this).find('a').attr('href'),
				book_name: xiyueta(this).find('a').attr('title'),
				book_pic: xiyueta(this).find('.lazyload').attr('data-original').startsWith('http') ?
					xiyueta(this).find('.lazyload').attr('data-original') : url + xiyueta(this)
					.find(
						'.lazyload').attr('data-original'),
				book_remarks: xiyueta(this).find('.detail p').eq(2).text().trim()
			});
		}
	})

	return {
		page: page,
		pagecount: (xiyueta('.visible-xs').find('a').text().match(/\/(\d+)/) && parseInt(xiyueta('.visible-xs')
			.find('a').text().match(/\/(\d+)/)[1])) || 1,
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