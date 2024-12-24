var title = 'dc5e';
var url = 'https://szyw.dc5e.com';
var ajax_timeout = 60 * 1000;

async function getVideos(link, key) {
	let json = await request(link);
	if (list === null) {
		return null;
	}
	let data = json.data;
	data = data[key];
	let videos = [];
	if (data) {
		data.some((n) => {
			if (typeof n.screen_url_m3u8 != 'undefined') {
				let id = n.screen_url_m3u8;
				let name = n.league_name_zh + ' ' + n.home_team_zh + ' VS ' + n.away_team_zh;
				let pic = n.cover;
				let remarks = n.nickname;
				videos.push({
					book_id: id,
					book_name: name,
					book_pic: pic,
					book_remarks: remarks,
				})
			}

		});
	}
	return videos
}

// 请求方法
async function request(reqUrl) {
	// console.log(reqUrl)
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': MOBILE_UA,
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
	var rule = {
		"分类": "全部&足球&篮球&综合",
		"分类值": "1&2&3&99",
	}
	let classes = [];
	let type_ids = rule["分类值"].split("&");
	rule["分类"].split("&").some((ele, index) => {
		classes.push({
			type_id: `${type_ids[index]}`,
			type_name: ele
		});
	})
	return {
		class: classes,
	};
}

// 获取列表
async function category(inReq) {
	const tid = inReq.id;
	const html = await getVideos(url + `/api/web/live_lists/${tid}`, 'data');
	if (html === null) {
		return {
			page: 1,
			pagecount: 0,
			list: [],
		};
	}
	return {
		page: 1,
		pagecount: 1,
		list: html,
	};
}

// 获取详细列表 
async function detail(inReq) {
	const ids = [inReq.id];
	const exts = [inReq.ext];
	const books = [];
	let i = 0;
	for (const id of ids) {
		const ext = exts[i];
		let book = {
			book_name: ext.book_name,
			book_director: ext.book_remarks,
			book_content: '',
		};
		let urls = [];
		urls.push(`播放$${id}`);

		book.urls = urls.join('#');
		books.push(book);
		i++;
	}
	return {
		list: books,
	};
}

// 获取内容
async function play(inReq) {
	return {
		content: inReq.id,
		label: inReq.label
	};
}

// 搜索
async function search(inReq) {
	const wd = inReq.wd;
	const html = await getVideos(url + `/api/web/search?keyword=${wd}`, 'ball');
	if (html === null) {
		return {
			list: [],
		};
	}
	return {
		list: html,
	};
}