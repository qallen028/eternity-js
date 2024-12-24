var title = '图下贝';
var url = 'https://www.tuxiaobei.com';
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
			type_id: '2',
			type_name: '儿歌'
		},
		{
			type_id: '3',
			type_name: '故事'
		},
		{
			type_id: '4',
			type_name: '国学'
		},
		{
			type_id: '25',
			type_name: '启蒙'
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

	const reqUrl = url + `/list/mip-data?typeId=${tid}&page=${page}&callback=`;
	const html = await request(reqUrl);
	if (html === null) {
		return {
			page: 1,
			pagecount: 0,
			list: [],
		};
	}

	let books = [];
	let jo = JSON.parse(html.replace(/\);$/, '').replace(/^[^{]*/, '')).data.items;
	jo.forEach(item => {
		books.push({
			book_id: item.video_id,
			book_name: item.name,
			book_pic: item.image,
			book_remarks: item.duration_string
		});
	});

	return {
		page: page,
		pagecount: page + 1,
		list: books,
	};
}

// 获取详情
async function detail(inReq) {
	const id = inReq.id;
	const ext = inReq.ext;
	const html = await request(url + '/play/' + id);
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

	const searchUrl = `${url}/search/index?key=${wd}`;
	const html = await request(searchUrl);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html);
	let books = [];
	xiyueta('.list-con .items').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('.text').text().trim(),
			book_pic: xiyueta(this).find('mip-img').attr('src'),
			book_remarks: xiyueta(this).find('.time').text().trim()
		});
	})

	return {
		page: page,
		pagecount: 1,
		list: books,
	};
}

// 播放内容
async function play(inReq) {
	try {
		const html = await axios({
			method: 'get',
			url: url + '/play/' + inReq.id,
			headers: {
				'User-Agent': IOS_UA
			}
		});
		if (html.data) {
			xiyueta.load(html.data);
			const src = xiyueta('body #videoWrap').attr('video-src');
			return {
				content: src,
				label: inReq.label,
				parse: 0
			};
		}
	} catch (e) {
		// console.log('获取播放地址失败:', e);
	}
	return {
		content: '',
		label: inReq.label,
		parse: 1
	};
}