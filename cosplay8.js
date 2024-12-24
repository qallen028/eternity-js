var title = 'cosplay8';
var url = 'https://www.cosplay8.com';
var ajax_timeout = 60 * 1000;

async function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

async function request(reqUrl) {
	// 	console.log(reqUrl)
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
	let i = 0
	xiyueta('.navbar-nav a[href!="/"]').each(function() {
		if (i < 5) {
			const type_id = xiyueta(this).attr('href')
			classes.push({
				type_id: type_id.replace('1', ''),
				type_name: xiyueta(this).text().trim()
			});
		}
		i++;
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
	const html = await request(url + `${tid}${page}`);
	if (html === null) {
		return {
			page: 1,
			pagecount: 0,
			list: [],
		};
	}
	xiyueta.load(html)
	let books = [];
	xiyueta('.picbox').each(function() {
		books.push({
			book_id: xiyueta(this).find('a:first').attr('href'),
			book_name: xiyueta(this).find('b').text().trim(),
			book_pic: xiyueta(this).find('img:first').attr('src')
		});
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
		const link = url + `${id}`
		const html = await request(link);
		if (html === null) {
			break;
		}
		xiyueta.load(html)
		let book = {
			book_name: xiyueta('h1').text().trim(),
			book_director: '',
			book_content: '',
			volumes: '',
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
	const link = url + `${id}`
	const html = await request(link);
	if (html === null) {
		return {
			content: content
		};
	}
	let player_str = getStrByRegex(/const images = (.*?)\; \/\/ 图片路径数组/, html);
	content = eval(player_str)
	return {
		content: content
	};
}
async function search(inReq) {
	return {
		list: [],
	};

}