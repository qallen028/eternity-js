var title = '爱影视';
var url = 'https://aiyingshis.com';
var ajax_timeout = 60 * 1000;

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
		"分类": "蓝光&电影&连续剧&综艺&动漫",
		"分类值": "37&1&2&3&4",
	}
	let classes = [];
	let type_ids = rule["分类值"].split("&");
	rule["分类"].split("&").some((ele, index) => {
		classes.push({
			type_id: `/vodtype/${type_ids[index]}`,
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
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;
	var link = page == 1 ? url + `${tid}.html` : url + `${tid}/page/${page}.html`
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
	xiyueta('.module-list .module-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a:first').attr('href'),
			book_name: xiyueta(this).find('a:first').attr('title'),
			book_pic: xiyueta(this).find('img:first').attr('data-src')
		});
	})
	const endPage = xiyueta('a:contains(尾页)').attr("href");
	const endPageArr = !!endPage ? endPage.split("/") : null;
	let pagecount = !!endPageArr ? getStrByRegex(/-(.*?)\.html/, endPageArr[endPageArr.length - 1]) : '';
	return {
		page: page,
		pagecount: !!endPageArr ? (!!pagecount ? pagecount : endPageArr[endPageArr.length - 1]) : page,
		list: books,
	};
}

// 获取详细列表 
async function detail(inReq) {
	const ids = [inReq.id];
	const books = [];
	for (const id of ids) {
		const html = await request(url + `${id}`);
		if (html === null) {
			break;
		}
		xiyueta.load(html)
		let book = {
			book_name: xiyueta('.page-title').text().trim(),
			book_director: xiyueta('.video-info-items:first a').text().trim(),
			book_content: xiyueta('.vod_content').text().trim(),
			volumes: xiyueta('.video-info-items').eq(3).find("div").text().trim(),
		};

		let froms = [];
		xiyueta('.module-player-tab .tab-item').each(function() {
			froms.push(xiyueta(this).find('span').text());
		})
		book.froms = froms.join('$$$');
		let fromUrls = [];
		xiyueta('.module-player-list').each(function() {
			let urls = [];
			xiyueta(this).find('.sort-item a').each(function() {
				const name = xiyueta(this).text();
				const link = xiyueta(this).attr('href');

				urls.push(name + '$' + link);
			})
			fromUrls.push(urls.join('#'))
		})
		book.urls = fromUrls.join('$$$');
		books.push(book);
	}
	// log(books);
	return {
		list: books,
	};
}

// 获取内容
async function play(inReq) {
	let id = inReq.id;
	const html = await request(url + id);
	if (html === null) {
		return {
			content: "",
			label: ""
		};
	}
	let player_str = getStrByRegex(/<script type="text\/javascript">var player_aaaa=(.*?)<\/script>/, html);
	let play_dic = JSON.parse(player_str);
	let content = !!play_dic['url'] ? decodeURIComponent(play_dic['url']) : ''
	return {
		content: content,
		label: inReq.label,
		is_video: isVideoFormat(content)
	};
}

// 搜索
async function search(inReq) {
	const wd = inReq.wd;
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;
	var link = page == 1 ? `${url}/vodsearch/wd/${wd}.html` : `${url}/vodsearch/page/${page}/wd/${wd}.html`
	const html = await request(link);
	if (html === null) {
		return {
			list: [],
		};
	}
	xiyueta.load(html)
	let books = [];
	xiyueta('.module-list .module-search-item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a:first').attr('href'),
			book_name: xiyueta(this).find('a:first').attr('title'),
			book_pic: xiyueta(this).find('img:first').attr('data-src')
		});
	})
	const endPage = xiyueta('a:contains(尾页)').attr("href");
	const pagecount = getStrByRegex(/page\/(.*?)\/wd/, endPage);
	return {
		page: page,
		pagecount: !!pagecount ? pagecount : page,
		list: books,
	};
}