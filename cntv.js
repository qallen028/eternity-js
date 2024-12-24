var title = 'CNTV';
var url = 'https://api.cntv.cn';
var ajax_timeout = 60 * 1000;

// 请求方法
async function request(reqUrl) {
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36'
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
			type_id: '4K专区',
			type_name: '4K专区'
		},
		{
			type_id: '栏目大全',
			type_name: '栏目大全'
		},
		{
			type_id: '特别节目',
			type_name: '特别节目'
		},
		{
			type_id: '纪录片',
			type_name: '纪录片'
		},
		{
			type_id: '电视剧',
			type_name: '电视剧'
		},
		{
			type_id: '动画片',
			type_name: '动画片'
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

	let books = [];
	let html;
	let pagecount = 1;
	if (tid === '栏目大全') {
		// 栏目大全
		html = await request(url + '/lanmu/columnSearch?&fl=&fc=&cid=&p=' + page +
			'&n=500&serviceId=tvcctv&t=json');
		if (html === null) {
			return {
				page: 1,
				pagecount: 0,
				list: [],
			};
		}
		const list = html.response.docs;
		list.forEach(it => {
			books.push({
				book_id: it.lastVIDE.videoSharedCode,
				book_name: it.column_name,
				book_pic: it.column_logo,
				book_remarks: it.channel_name,
				extra: {
					sc: it.column_firstclass,
					year: it.column_playdate,
					channel: it.channel_name,
					brief: it.column_brief,
					last_title: it.lastVIDE.videoTitle,
					category: tid
				}
			});
		});
		pagecount = Math.ceil(html.response.numFound / list.length)
	} else if (tid === '4K专区') {
		// 4K专区
		html = await request(url + '/NewVideo/getLastVideoList4K?serviceId=cctv4k&cid=&p=' + page +
			'&n=500&serviceId=tvcctv&t=json');
		if (html === null) {
			return {
				page: 1,
				pagecount: 0,
				list: [],
			};
		}
		const list = html.data.list;
		list.forEach(it => {
			books.push({
				book_id: it.id,
				book_name: it.title,
				book_pic: it.image,
				book_remarks: it.sc + ((typeof it.year === 'undefined' || it.year === '') ? '' : (
					'•' + it.year)) + ((typeof it.count === 'undefined' || it.count === '') ?
					'' : ('•共' + it.count + '集')),
				extra: {
					area: typeof it.area == 'undefined' ? '' : it.area,
					sc: typeof it.sc == 'undefined' ? '' : it.sc,
					actors: typeof it.actors == 'undefined' ? '' : it.actors,
					year: typeof it.year == 'undefined' ? '' : it.year,
					channel: typeof it.channel == 'undefined' ? '' : it.channel,
					brief: typeof it.brief == 'undefined' ? '' : it.brief,
					count: typeof it.count == 'undefined' ? '' : it.count,
					category: tid
				}
			});
		});
		pagecount = Math.ceil(html.data.total / list.length)
	} else {
		// 其他分类
		const channelMap = {
			"特别节目": "CHAL1460955953877151",
			"纪录片": "CHAL1460955924871139",
			"电视剧": "CHAL1460955853485115",
			"动画片": "CHAL1460955899450127",
		};
		html = await request(url + '/list/getVideoAlbumList?channelid=' + channelMap[tid] + '&fc=' + tid + '&p=' +
			page + '&n=24&serviceId=tvcctv&t=json');
		if (html === null) {
			return {
				page: 1,
				pagecount: 0,
				list: [],
			};
		}
		const list = html.data.list;
		list.forEach(it => {
			books.push({
				book_id: it.id,
				book_name: it.title,
				book_pic: it.image,
				book_remarks: it.sc + ((typeof it.year === 'undefined' || it.year === '') ? '' : (
					'•' + it.year)) + ((typeof it.count === 'undefined' || it.count === '') ?
					'' : ('•共' + it.count + '集')),
				extra: {
					area: it.area,
					sc: it.sc,
					actors: it.actors,
					year: it.year,
					channel: it.channel,
					brief: it.brief,
					count: it.count,
					category: tid
				}
			});
		});
		pagecount = Math.ceil(html.data.total / list.length)
	}

	return {
		page: page,
		pagecount: pagecount,
		list: books,
	};
}

// 获取详情
async function detail(inReqs) {
	const inReq = inReqs.ext;
	const id = inReq.id;
	const extra = inReq.extra;
	let book = {
		book_name: inReq.book_name,
		book_pic: inReq.book_pic,
		book_content: extra.brief,
		book_director: extra.channel,
		book_actor: extra.actors,
		book_area: extra.area,
		book_year: extra.year,
		book_remarks: extra.count ? ('共' + extra.count + '集') : ('更新至' + extra.last_title)
	};

	// 获取播放列表
	let playUrls = [];
	if (extra.category === '栏目大全') {
		const html = await request(url + '/video/videoinfoByGuid?guid=' + id + '&serviceId=tvcctv');
		if (html === null) {
			return {
				list: []
			};
		}
		const ctid = html.ctid.replace('https://api.cntv.cn/lanmu/', '');
		const list = await request(url + '/NewVideo/getVideoListByColumn?id=' + ctid +
			'&d=&p=1&n=100&sort=desc&mode=0&serviceId=tvcctv&t=json');
		if (list !== null) {
			playUrls = list.data.list;
		}
	} else {
		const modeMap = {
			"4K专区": "0",
			"特别节目": "0",
			"纪录片": "0",
			"电视剧": "0",
			"动画片": "1",
		};
		const mode = typeof modeMap[extra.category] == 'undefined' ? 0 : modeMap[extra.category];
		const html = await request(url + '/NewVideo/getVideoListByAlbumIdNew?id=' + id +
			'&serviceId=tvcctv&p=1&n=100&mode=' + mode + '&pub=1');
		if (html !== null && html.errcode !== '1001') {
			playUrls = html.data.list;
			// 获取更多分页数据
			let page = 1;
			while (true) {
				page++;
				const more = await request(url + '/NewVideo/getVideoListByAlbumIdNew?id=' + id +
					'&serviceId=tvcctv&p=' + page + '&n=100&mode=' + mode + '&pub=1');
				if (more === null || more.data.list.length === 0) break;
				playUrls = playUrls.concat(more.data.list);
			}
		}
	}

	let urls = [];
	playUrls.forEach(it => {
		urls.push(it.title + '$' + it.guid + '|' + it.type + '|' + it.fc);
	});

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
	const info = inReq.id.split('|');
	const id = info[0];
	const k4 = info[1];
	const fc = info[2];

	let content = '';
	if (k4 === '7' && fc !== '体育') {
		content = 'https://hls.cntv.myhwcdn.cn/asp/hls/4000/0303000a/3/default/' + id + '/4000.m3u8';
	} else {
		content = 'https://cntv.playdreamer.cn/proxy/asp/hls/2000/0303000a/3/default/' + id + '/2000.m3u8';
	}

	return {
		content: content,
		label: inReq.label
	};
}