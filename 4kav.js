var title = '4KAV';
var url = 'https://4k-av.com';
var ajax_timeout = 60 * 1000;

// 请求方法
async function request(reqUrl) {
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'User-Agent': IOS_UA,
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
			type_id: '/zh/tv/',
			type_name: '電視劇'
		},
		{
			type_id: '/zh/movie/',
			type_name: '電影'
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
	const html = await request(url + `${tid}page-${page}.html`);
	if (html === null) {
		return {
			page: 1,
			pagecount: 0,
			list: [],
		};
	}
	xiyueta.load(html)
	let books = [];
	xiyueta('#MainContent_newestlist .NTMitem').each(function() {
		books.push({
			book_id: xiyueta(this).find('.title a').attr('href'),
			book_name: xiyueta(this).find('.title a').attr('title'),
			book_pic: xiyueta(this).find('.poster img').attr('src')
		});
	})
	const endPage = xiyueta(".page-number").text();
	const endPageArr = !!endPage ? endPage.split("/") : null;
	return {
		page: page,
		pagecount: !!endPageArr ? endPageArr[endPageArr.length - 1] : page,
		list: books,
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
		const html = await request(url + `${id}`);
		if (html === null) {
			break;
		}
		xiyueta.load(html)
		let book = {
			book_name: ext.book_name,
			book_director: xiyueta('#MainContent_videodetail').find('label').eq(1).text().trim(),
			book_content: xiyueta('#MainContent_videodesc').text().trim(),
			volumes: xiyueta('#MainContent_tags').text().trim(),
		};
		let urls = [];
		xiyueta('#rtlist li').each(function() {
			const name = xiyueta(this).find("span").text();
			let link = xiyueta(this).find("a").attr('href');
			if (link === undefined) {
				link = id;
			}
			urls.push(name + '$' + link);
		})
		if (urls.length == 0) {
			urls.push(ext.book_name + '$' + id);
		}
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
	let id = inReq.id;
	const html = await request(url + id);
	if (html === null) {
		return {
			content: "",
			label: ""
		};
	}
	xiyueta.load(html)
	var content = xiyueta('source').attr('src');
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

	var link = page == 1 ? `${url}/s?k=${wd}` : `${url}/s?k=${wd}&page=${page}`
	const html = await request(link);
	if (html === null) {
		return {
			list: [],
		};
	}
	xiyueta.load(html)
	let books = [];
	xiyueta('#MainContent_newestlist .NTMitem').each(function() {
		books.push({
			book_id: xiyueta(this).find('.title a').attr('href'),
			book_name: xiyueta(this).find('.title a').attr('title'),
			book_pic: xiyueta(this).find('.poster img').attr('src')
		});
	})
	let pagecount = 1;
	try {
		const endPage = xiyueta(".page-number").text();
		const endPageArr = !!endPage ? endPage.split("/") : null;
		pagecount = !!endPageArr ? ((endPageArr[endPageArr.length - 1] > 2) ? endPageArr[endPageArr.length - 1] -
			1 :
			endPageArr[endPageArr.length - 1]) : page;
	} catch (error) {}
	return {
		page: page,
		pagecount: pagecount,
		list: books,
	};
}