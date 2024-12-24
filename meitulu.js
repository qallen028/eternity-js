var title = '美图录';
var url = 'https://meitulu.me';
var ajax_timeout = 60 * 1000;

async function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

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
	xiyueta('#xx_navbar .dropdown-menu a').each(function() {

		classes.push({
			type_id: xiyueta(this).attr('href'),
			type_name: xiyueta(this).text().trim()
		});
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
	const html = await request(url + `${tid}index_${page}.html`);
	if (html === null) {
		return {
			page: 1,
			pagecount: 0,
			list: [],
		};
	}
	xiyueta.load(html)
	let books = [];
	xiyueta('.my-card').each(function() {
		const book_id = xiyueta(this).find('a:first').attr('href')
		if (!!book_id) {
			books.push({
				book_id: book_id.replace('.html', ''),
				book_name: xiyueta(this).parent().find('.my-card-title').text().trim(),
				book_pic: url + xiyueta(this).find('img:first').attr('src')
			});
		}
	})
	const pagecount = xiyueta(".page-item:last").prev().find("a").text();
	return {
		page: page,
		pagecount: !!pagecount ? pagecount : page,
		list: books,
	};
}



async function detail(inReq) {
	const ids = [inReq.id];
	const books = [];
	for (const id of ids) {
		const link = url + `${id}.html`
		const html = await request(link);
		if (html === null) {
			break;
		}
		xiyueta.load(html)
		let book = {
			book_name: xiyueta('.top-title').text().trim(),
			book_director: xiyueta('.mb-1').eq(0).find('a').text().trim(),
			book_content: xiyueta('.mb-1').eq(3).text().trim(),
			volumes: xiyueta('.mb-1').eq(5).text().trim(),
		};

		let urls = [];
		urls.push(`查看$${id}`);
		book.urls = urls.join('#');
		books.push(book);

	}
	return {
		list: books,
	};
}

async function play(inReq) {
	let id = inReq.id;
	let content = [];
	let page = 2;
	for (let i = 1; i < page; i++) {
		const link = (i == 1) ? url + `${id}.html` : url + `${id}_${i}.html`
		const html = await request(link);
		if (html === null) {
			return {
				content: content
			};
		}
		xiyueta.load(html)

		if (i == 1) {
			let npage = xiyueta(".page-item:last").prev().find("a").text();
			if (!!npage && npage > 2) {
				page = npage
			}
		}
		xiyueta('.container-inner-fix-m img').each(function() {
			const img = url + xiyueta(this).attr('src');
			if (!!img) {
				content.push(img);
			}
		})
		await sleep(500);
	}

	return {
		content: content
	};
}
async function search(inReq) {
	const wd = inReq.wd;
	const pg = inReq.page;
	let page = pg || 1;
	if (page == 0) page = 1;
	var link = page == 1 ? `${url}/search?q=${wd}` : `${url}/s?q=${wd}&page=${page}`
	const html = await request(link);
	if (html === null) {
		return {
			list: [],
		};
	}
	xiyueta.load(html)
	let books = [];
	xiyueta('.my-card').each(function() {
		const book_id = xiyueta(this).find('a:first').attr('href')
		if (!!book_id) {
			books.push({
				book_id: book_id.replace('.html', ''),
				book_name: xiyueta(this).find('.my-card-title').text().trim(),
				book_pic: url + xiyueta(this).find('img:first').attr('src')
			});
		}
	})
	const pagecount = xiyueta(".page-item:last").prev().find("a").text();
	return {
		page: page,
		pagecount: !!pagecount ? pagecount : page,
		list: books,
	};
}