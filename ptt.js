var title = 'PTT[优]';
var url = 'https://ptt.red';
var ajax_timeout = 60 * 1000;

// 请求方法
async function request(reqUrl) {
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': 'MOBILE_UA',
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
	const html = await request(url + '/zh-cn');
	if (html === null) {
		return {
			class: {},
		};
	}
	xiyueta.load(html)
	let classes = [];
	xiyueta('.nav-tabs a').each(function() {
		classes.push({
			type_id: xiyueta(this).attr('href'),
			type_name: xiyueta(this).text().trim()
		});
	})
	return {
		class: classes,
	};
}

// 获取列表
async function category(inReq) {
	const tid = inReq.id;
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;

	let link = '';
	link = `${url}${tid}?page=${page}`;
	const html = await request(link);
	if (html === null) {
		return {
			page: 1,
			pagecount: 0,
			list: [],
		};
	}

	xiyueta.load(html)
	let books = [];
	xiyueta('.container-fluid .item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('img').attr('alt'),
			book_pic: url + xiyueta(this).find('img').attr('src'),
			book_remarks: xiyueta(this).find('.badge-success').text().trim()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta(".page-item.next").prev().find("a").attr("href") && parseInt(xiyueta(".page-item.next")
			.prev().find("a").attr("href").match(/page=(\d+)/)[1])) || 999,
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
		book_name: xiyueta('h3').text().trim(),
		book_pic: url + xiyueta('.img-fluid').attr('src'),
		book_content: '',
		book_actor: '',
		book_director: '',
		book_area: ''
	};

	let urls = [];
	xiyueta(`.seqs`).find('a').each(function() {
		const name = xiyueta(this).text();
		const link = xiyueta(this).attr('href');
		urls.push(name + '$' + link);
	});
	if (urls.length == 0) {
		const href = xiyueta(".img-fluid").parent().attr('href')
		if (typeof href != 'undefined') {
			urls.push('播放$' + href);
		}
	}

	book.urls = urls.join('#');
	return {
		list: [book]
	};
}

// 获取播放内容
async function play(inReq) {
	let id = inReq.id;
	const html = await request(url + id);
	if (html === null) {
		return {
			content: "",
			label: ""
		};
	}
	// 提取视频地址
	let content = '';
	let player_str = getStrByRegex(/application\/ld\+json">(.*?)<\/script>/, html);
	if (!player_str) {
		return {
			content: "",
			label: inReq.label
		};
	}
	let play_dic = JSON.parse(player_str);
	content = play_dic.contentUrl;
	return {
		content: content,
		label: inReq.label
	};
}

// 搜索
async function search(inReq) {
	const wd = inReq.wd;
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;

	const link = `${url}/zh-cn/q/${wd}?page=${page}`;
	const html = await request(link);
	if (html === null) {
		return {
			list: [],
		};
	}

	xiyueta.load(html)
	let books = [];
	xiyueta('#videos .item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a').attr('href'),
			book_name: xiyueta(this).find('img').attr('alt'),
			book_pic: url + xiyueta(this).find('img').attr('src'),
			book_remarks: xiyueta(this).find('.badge-success').text().trim()
		});
	})

	return {
		page: page,
		pagecount: (xiyueta(".page-item.next").prev().find("a").attr("href") && parseInt(xiyueta(".page-item.next")
			.prev().find("a").attr("href").match(/page=(\d+)/)[1])) || 1,
		list: books,
	};
}