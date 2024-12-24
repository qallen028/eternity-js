var title = '影色天堂';
var url = 'https://www.sdsrty.com';
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
		"分类": "电影&剧集&综艺&动漫&短剧&解说",
		"分类值": "1&2&3&4&41&42",
	}
	let classes = [];
	let type_ids = rule["分类值"].split("&");
	rule["分类"].split("&").some((ele, index) => {
		classes.push({
			type_id: `/index.php/vod/type/id/${type_ids[index]}`,
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
	xiyueta('.new-up-list .item').each(function() {
		books.push({
			book_id: xiyueta(this).find('a:first').attr('href'),
			book_name: xiyueta(this).find('.subject b').text(),
			book_pic: xiyueta(this).find('img').attr('data-original')
		});
	})
	const endPage = xiyueta('a:contains(尾页)').attr("href");
	const endPageArr = !!endPage ? endPage.replace(/\.html$/, "").split("/") : null;
	return {
		page: page,
		pagecount: !!endPageArr ? endPageArr[endPageArr.length - 1] : page,
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
			book_name: xiyueta('.article-subject-m a').text().trim(),
			book_director: xiyueta('.info-wrap .director a').text().trim(),
			book_content: xiyueta('.summary-con').text().trim(),
			volumes: xiyueta('.info-wrap .year span').text().trim(),
		};
		let froms = [];
		xiyueta('.nav-tabs .swiper-slide').each(function() {
			froms.push(xiyueta(this).find('a').text());
		})
		book.froms = froms.join('$$$');
		let fromUrls = [];
		xiyueta('.episodes-list').each(function() {
			let urls = [];
			xiyueta(this).find(' a').each(function() {
				const name = xiyueta(this).text();
				const link = xiyueta(this).attr('href');

				urls.push(name + '$' + link);
			})
			fromUrls.push(urls.join('#'))
		})
		book.urls = fromUrls.join('$$$');
		books.push(book);
	}
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
	return {
		content: !!play_dic['url'] ? decodeURIComponent(play_dic['url']) : '',
		label: inReq.label
	};
}

// 搜索
async function search(inReq) {
	return {
		list: [],
	};
}