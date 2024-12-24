var title = '310tv';
var url = 'http://www.310.tv';
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
			type_id: '0',
			type_name: '热门'
		},
		{
			type_id: '1',
			type_name: '足球'
		},
		{
			type_id: '2',
			type_name: '篮球'
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

	const reqUrl = url + `/?s=0&t=1&a=${tid}&g=${page}`;
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
	xiyueta('.list_content a').each(function() {
		let title = [];
		xiyueta(this).find('.jiabifeng p').slice(0, 5).each(function() {
			title.push(xiyueta(this).text().trim());
		});

		books.push({
			book_id: xiyueta(this).attr('href'),
			book_name: title.join(' '),
			book_pic: xiyueta(this).find('.feleimg img').attr('src'),
			book_remarks: xiyueta(this).attr('t-nzf-o')
		});
	})

	return {
		page: page,
		pagecount: 1,
		list: books,
	};
}

// 获取详情
async function detail(inReq) {
	const id = inReq.id;
	const ext = inReq.ext;

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
	urls.push('直播$' + id);

	book.urls = urls.join('#');
	return {
		list: [book]
	};
}

// 搜索功能
async function search(inReq) {
	return {
		list: []
	};
}

// 播放内容
async function play(inReq) {
	return {
		content: inReq.id,
		label: inReq.label,
		parse: 0,
		webview: true
	};
}