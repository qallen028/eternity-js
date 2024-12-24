var title = '酷奇MV';
var url = 'https://www.kuqimv.com';
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
			type_name: '华语高清'
		},
		{
			type_id: '2',
			type_name: '日韩精选'
		},
		{
			type_id: '3',
			type_name: '欧美MV'
		},
		{
			type_id: '4',
			type_name: '高清现场'
		},
		{
			type_id: '5',
			type_name: '影视MV'
		},
		{
			type_id: '6',
			type_name: '夜店视频'
		},
		{
			type_id: '7',
			type_name: '车模视频'
		},
		{
			type_id: '8',
			type_name: '热舞视频'
		},
		{
			type_id: '9',
			type_name: '美女写真'
		},
		{
			type_id: '10',
			type_name: '美女打碟'
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

	const reqUrl = url + `/play/${tid}_${page}.html`;
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
	xiyueta('.mv_list li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('.name').text().trim(),
			book_pic: xiyueta(this).find('img').attr('src'),
			book_remarks: '' + xiyueta(this).find('.singer').text().trim() +
				'｜' + xiyueta(this).find('.time').text().trim()
		});
	})

	return {
		page: page,
		pagecount: xiyueta('.lei_page a:last').attr('href').match(/\d+_(\d+)\.html/)[1],
		list: books,
	};
}

// 获取详情
async function detail(inReq) {
	const id = inReq.id;
	const ext = inReq.ext;
	const html = await request(url + id);
	if (html === null) {
		return {
			list: []
		};
	}

	xiyueta.load(html);
	let book = {
		book_name: ext.book_name,
		book_pic: ext.book_pic,
		book_content: '',
		book_year: '',
		book_area: '',
		book_actor: '',
		book_director: ''
	};

	// 获取播放列表
	let urls = [];
	urls.push('播放$' + id);

	book.urls = urls.join('#');
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

	const searchUrl = `${url}/search.php?key=${wd}&pages=${page}`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.video_list li').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('a').attr('title'),
			book_pic: xiyueta(this).find('img').attr('src'),
			book_remarks: xiyueta(this).find('.singer').text().trim() +
				'｜' + xiyueta(this).find('.t_03').eq(1).text().trim()
		});
	})

	return {
		page: page,
		pagecount: xiyueta('.lei_page a:last').attr('href').match(/pages=(\d+)/)[1],
		list: books,
	};
}

// 播放内容
async function play(inReq) {
	const id = inReq.id;
	const html = await axios({
		method: 'post',
		url: url + '/skin/kuqimv/play.php',
		data: 'id=' + id.match(/\d+/)[0],
		headers: {
			'User-Agent': MOBILE_UA,
			'Content-Type': 'application/x-www-form-urlencoded',
			'X-Requested-With': 'XMLHttpRequest'
		}
	});
	if (typeof html.data != 'undefined') {
		const data = html.data
		return {
			content: typeof data.url != 'undefined' ? data.url : '',
			label: inReq.label,
			parse: 1
		};
	}
	return {
		content: '',
		label: inReq.label,
		parse: 1
	};
}