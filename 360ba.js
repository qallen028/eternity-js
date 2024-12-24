var title = '360吧';
var url = 'https://m.360ba.co';
var ajax_timeout = 1000 * 60;

// 请求方法
async function request(reqUrl) {
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': MOBILE_UA,
			'Referer': url,
			'Origin': url
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
			type_name: '全部'
		},
		{
			type_id: '2',
			type_name: '足球'
		},
		{
			type_id: '3',
			type_name: '篮球'
		},
		{
			type_id: '99',
			type_name: '综合'
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
	if (page > 1) {
		return {
			page: page,
			pagecount: 1,
			list: [],
		};
	}

	const reqUrl = url + `/api/web/live_lists/${tid}`;
	const html = await request(reqUrl);
	if (html === null) {
		return {
			page: 1,
			pagecount: 0,
			list: [],
		};
	}

	let books = [];
	try {
		const jo = JSON.parse(JSON.stringify(html));
		const list = jo.data.data || [];
		list.forEach(item => {
			books.push({
				book_id: item.url,
				book_name: item.league_name_zh + ' ' + item.home_team_zh + ' VS ' + item
					.away_team_zh,
				book_pic: item.cover,
				book_remarks: item.nickname
			});
		});
	} catch (e) {}

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
	const wd = inReq.wd;
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;
	if (page > 1) {
		return {
			list: []
		};
	}

	const searchUrl = `${url}/api/web/search?keyword=${wd}`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	let books = [];
	try {
		const jo = JSON.parse(JSON.stringify(html));
		const list = jo.data.ball || [];
		list.forEach(item => {
			books.push({
				book_id: item.url,
				book_name: item.league_name_zh + ' ' + item.home_team_zh + ' VS ' + item
					.away_team_zh,
				book_pic: item.cover,
				book_remarks: item.nickname
			});
		});
	} catch (e) {}

	return {
		page: page,
		pagecount: 1,
		list: books,
	};
}

// 播放内容
async function play(inReq) {
	return {
		content: inReq.id,
		label: inReq.label,
		parse: 0,
		headers: {
			'User-Agent': MOBILE_UA,
			'Referer': url,
			'Origin': url
		}
	};
}