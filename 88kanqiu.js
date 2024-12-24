var title = '88看球';
var url = 'http://www.88kanqiu.dog';
var ajax_timeout = 5000;

// 请求方法
async function request(reqUrl) {
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': PC_UA
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
	const html = await request(url);
	if (html === null) {
		return {
			class: []
		};
	}

	xiyueta.load(html);
	let classes = [];
	xiyueta('.nav-pills li').each(function() {
		const href = xiyueta(this).find('a').attr('href');
		if (href && href.match(/\/match\/(\d+)\/live/)) {
			classes.push({
				type_id: href.match(/\/match\/(\d+)\/live/)[1],
				type_name: xiyueta(this).find('a').text().trim()
			});
		}
	});

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

	const reqUrl = url + `/match/${tid}/live`;
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
	xiyueta('.list-group .group-game-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('.d-none').text().trim().replace(/\n/g, '').replace(
				/\s+/g, ''),
			book_pic: xiyueta(this).find('img').attr('src'),
			book_remarks: xiyueta(this).find('.btn').text().trim()
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
	const html = await request(url + id);
	if (html === null) {
		return {
			list: []
		};
	}

	xiyueta.load(html);
	let book = {
		book_name: xiyueta('title').text().trim(),
		book_pic: xiyueta('img').attr('src'),
		book_content: '',
		book_actor: xiyueta('.team-name').eq(0).text().trim(),
		book_director: xiyueta('.team-name').eq(1).text().trim()
	};
	// 获取播放列表
	let urls = [];
	try {
		const playUrl = await request(url + id.replace('play', 'play-url'));
		let pdata = JSON.parse(JSON.stringify(playUrl)).data;
		pdata = pdata.slice(6, -2);
		pdata = atob(pdata);
		let jo = JSON.parse(pdata).links;
		jo.forEach(it => {
			let name = decodeURIComponent(escape(it.name)); // 解决中文乱码
			urls.push(name + '$' + encodeURIComponent(it.url));
		});
	} catch (e) {}

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
	const id = decodeURIComponent(inReq.id);
	let webview = true;
	let content = id;

	if (/embed=/.test(id)) {
		webview = false
		let url = id.match(/embed=(.*?)&/)[1];
		content = atob(url).split('#')[0];
	} else if (/\?url=/.test(id)) {
		webview = false
		content = id.split('?url=')[1].split('#')[0];
	}

	return {
		content: content,
		label: inReq.label,
		parse: 0,
		webview: webview
	};
}