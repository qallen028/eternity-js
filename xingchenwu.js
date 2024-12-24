var title = '星辰屋';
var url = 'http://www.xingchenwu.com';
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
			'platform': 'iPhone' // 添加平台标识
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
			type_name: '电视剧'
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
	let reqUrl = url + '/' + tid;
	if (page > 1) {
		reqUrl += '/index' + page + '.html';
	} else {
		reqUrl += '/index.html';
	}

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
	xiyueta('.stui-vodlist li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('.lazyload').attr('data-original'),
			book_remarks: xiyueta(this).find('.pic-text').text()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta('.visible-xs .num').text().match(/\/(\d+)/) && parseInt(xiyueta('.visible-xs .num').text().match(/\/(\d+)/)[1])) || 1,
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
		book_name: xiyueta('.stui-content__detail h1').text().trim(),
		book_pic: xiyueta('.stui-content__thumb .lazyload').attr('data-original'),
		book_content: xiyueta('.detail-content').text().trim(),
		book_director: xiyueta('.data span:eq(1)').text().trim(),
		book_actor: xiyueta('.data span:eq(2)').text().trim()
	};

	// 获取播放列表
	let urls = [];
	xiyueta('.stui-content__playlist li').each(function() {
		const name = xiyueta(this).find('a').text();
		const link = xiyueta(this).find('a').attr('href');
		urls.push(name + '$' + link);
	});

	book.urls = urls.join('#');
	return {
		list: [book]
	};
}

// 搜索功能
async function search(inReq) {
	const wd = inReq.wd;

	const searchUrl = `${url}/search.php`;
	const html = await axios({
		method: 'post',
		url: searchUrl,
		data: `searchword=${wd}`,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'User-Agent': UC_UA
		}
	}).then(resp => resp.data);

	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.stui-vodlist__media li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('.lazyload').attr('data-original'),
			book_remarks: xiyueta(this).find('.pic-text').text()
		});
	})

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
	let now = getStrByRegex(/var now=base64decode\("(.*?)"\)/, html);
	if (now) {
		content = atob(now);
	}
	return {
		content: content,
		label: inReq.label
	};
}