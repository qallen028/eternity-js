var title = '崩坏';
var url = 'https://www.bengou.co';
var ajax_timeout = 60 * 1000;

async function request(reqUrl) {
	// console.log(reqUrl)
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': PC_UA,
		}
	})
	if (resp.status == 200) {
		return resp.data;
	} else {
		return null;
	}

}

async function home() {
	const html = await request(url);
	if (html === null) {
		return {
			class: {},
		};
	}
	xiyueta.load(html)
	let classes = [];
	xiyueta('.nav_menu a').each(function() {
		const type_name = xiyueta(this).text().trim();
		if (type_name != '漫画首页') {
			classes.push({
				type_id: xiyueta(this).attr('href'),
				type_name: type_name
			});
		}

	})
	return {
		class: classes,
	};
}

async function category(inReq) {
	const tid = inReq.id;
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;
	const html = await request(`${url}${tid}${page}.html`);
	if (html === null) {
		return {
			page: 1,
			pagecount: 0,
			list: [],
		};
	}
	xiyueta.load(html)
	const books = [];
	xiyueta('.dmList li').each(function() {
		books.push({
			book_id: xiyueta(this).find('dt a:first').attr('href'),
			book_name: xiyueta(this).find('dt a:first').text(),
			book_pic: xiyueta(this).find('img:first').attr('src'),
			book_remarks: xiyueta(this).find('span:first').text()
		});
	})
	const endPage = xiyueta('a:contains(尾页)').attr("href");
	const endPageArr = !!endPage ? endPage.split(".html") : null;
	return {
		page: page,
		pagecount: !!endPageArr ? endPageArr[0] : page,
		list: books,
	};
}



async function detail(inReq) {
	const ids = [inReq.id];
	const books = [];
	for (const id of ids) {
		const html = await request(url + id);
		if (html === null) {
			break;
		}
		xiyueta.load(html)
		let book = {
			book_name: xiyueta('.title h1').text().trim(),
			book_director: xiyueta('.info p:contains(原著作者) a').text().trim(),
			book_content: xiyueta('.introduction').text().trim(),
			volumes: xiyueta('.title a:first').text().trim(),
		};
		let urls = [];
		xiyueta('.plist a').each(function() {
			const title = xiyueta(this).text().trim();
			if (title === null) {
				title = '观看'
			}
			const href = xiyueta(this).attr('href');
			urls.push(title + '$' + href);
		})
		book.urls = urls.join('#');
		books.push(book);
	}
	return {
		list: books,
	};
}

async function play(inReq) {
	let id = inReq.id;
	const html = await request(url + id);
	const matches = html.match(/var qTcms_S_m_murl_e=\"(.*)\";/);
	const decoded = atob(matches[1]);
	const picList = decoded.split('$');
	const content = [];
	for (let i = 0; i < picList.length; i += 2) {
		content.push(picList[i]);
	}
	return {
		content: content,
	};
}

async function search(inReq) {
	const wd = inReq.wd;
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;
	var link = page == 1 ? `${url}/statics/search.aspx?key=${wd}` :
		`${url}/statics/search.aspx?key=${wd}&page=${page}`
	const html = await request(link);
	if (html === null) {
		return {
			list: [],
		};
	}
	xiyueta.load(html)
	const books = [];
	xiyueta('.dmList li').each(function() {
		books.push({
			book_id: xiyueta(this).find('dt a:first').attr('href'),
			book_name: xiyueta(this).find('dt a:first').text(),
			book_pic: xiyueta(this).find('img:first').attr('src'),
			book_remarks: xiyueta(this).find('span:first').text()
		});
	})
	const endPage = xiyueta('a:contains(尾页)').attr("href");
	let pagecount = getStrByRegex(/&page=(.*)/, endPage);
	return {
		page: page,
		pagecount: !!pagecount ? pagecount : page,
		list: books,
	};
}