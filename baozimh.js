var title = '暴漫';
var url = 'https://cn.baozimh.com';
var img = 'https://static-tw.baozimh.com/cover/';
var img2 = '?w=285&h=375&q=100';
var ajax_timeout = 60 * 1000;

async function request(reqUrl) {
	// console.log(reqUrl)
	let resp = await axios({
		method: 'get',
		url: reqUrl,
		sslVerify: false,
		timeout: ajax_timeout,
		headers: {
			'Accept-Language': 'zh-CN,zh;q=0.8',
			'User-Agent': MOBILE_UA,
		}
	})
	if (resp.status == 200) {
		return resp.data;
	} else {
		return null;
	}

}

async function home() {
	const html = await request(url + '/classify');
	if (html === null) {
		return {
			class: {},
		};
	}
	xiyueta.load(html)
	let classes = [];
	xiyueta('div.classify .classify-nav').each(function() {
		const that = this;
		xiyueta(that).find("a").each(function() {
			const type_name = xiyueta(this).text().trim();
			if (type_name != '全部') {
				classes.push({
					type_id: decodeHTMLEntities(xiyueta(this).attr('href')),
					type_name: type_name
				});
			}
		})

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
	const type = getQueryParameter("type", tid);
	const region = getQueryParameter("region", tid);
	const state = getQueryParameter("state", tid);
	const filter = getQueryParameter("filter", tid);
	let link =
		`${url}/api/bzmhq/amp_comic_list?type=${type|| 'all'}&region=${region|| 'all'}&state=${state || 'all'}&filter=${filter || '*'}`;
	link += '&page=' + page + '&limit=36&language=cn';
	const html = await request(link);
	if (html === null) {
		return {
			page: 1,
			pagecount: 0,
			list: [],
		};
	}
	let books = [];
	for (const book of html.items) {
		books.push({
			book_id: book.comic_id,
			book_name: book.name,
			book_pic: img + book.topic_img + img2,
			book_remarks: book.author || '',
		});
	}
	return {
		page: page,
		pagecount: books.length == 36 ? page + 1 : page,
		list: books,
	};
}



async function detail(inReq) {
	const ids = [inReq.id];
	const books = [];
	for (const id of ids) {
		const html = await request(`${url}/comic/${id}`);
		if (html === null) {
			break;
		}
		// log(html);
		xiyueta.load(html)
		let book = {
			book_name: xiyueta('.comics-detail__title').text().trim(),
			book_director: xiyueta('.comics-detail__author').text().trim(),
			book_content: xiyueta('.comics-detail__desc').text().trim(),
			volumes: xiyueta('.tag-list').next().find("em").text().trim(),
		};
		let urls = [];
		xiyueta('#chapter-items .comics-chapters').each(function() {
			const name = xiyueta(this).find("span").text().trim();
			const link = xiyueta(this).find('a').attr('href');
			urls.push(name + '$' + decodeURIComponent(link));
		})
		if (urls.length == 0) {
			xiyueta('.comics-chapters').each(function() {
				const name = xiyueta(this).find("span").text().trim();
				const link = xiyueta(this).find('a').attr('href');
				urls.push(name + '$' + decodeURIComponent(link));
			})
			urls = [...urls].reverse();
		}
		book.urls = urls.join('#');
		books.push(book);
	}
	return {
		list: books,
	};
}

async function play(inReq) {
	let id = inReq.id;
	id = decodeHTMLEntities(id);
	const comic_id = getQueryParameter("comic_id", id);
	const section_slot = getQueryParameter("section_slot", id);
	const chapter_slot = getQueryParameter("chapter_slot", id);
	const html = await request(url + `/comic/chapter/${comic_id}/${section_slot}_${chapter_slot}.html`);
	if (html === null) {
		return {
			content: []
		};
	}
	xiyueta.load(html)
	let content = [];
	xiyueta('amp-img').each(function() {
		const img = xiyueta(this).attr('src');
		content.push(img);
	})
	return {
		content: content
	};
}

async function search(inReq) {
	const wd = inReq.wd;
	const html = await request(`${url}/search?q=${wd}`);
	if (html === null) {
		return {
			list: [],
		};
	}
	xiyueta.load(html)
	let books = [];
	xiyueta('div.classify-items a.comics-card__poster').each(function() {
		books.push({
			book_id: xiyueta(this).attr('href').replace('/comic/', ''),
			book_name: xiyueta(this).attr('title'),
			book_pic: xiyueta(this).find('amp-img:first').attr('src')
		});
	})
	// 	log(books)

	return {
		list: books,
	};
}