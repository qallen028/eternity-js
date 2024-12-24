var title = '南书房';
var url = 'http://www.nssfh.com';
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
	const class_name = '性感写真&清纯美女&香车美女&运动宝贝&魅力新娘'.split("&"); //静态分类名称拼接
	const class_url = '/tuku/xgxz/&/tuku/qcmn/&/tuku/xcmn/&/tuku/ydbb/&/tuku/mlxn/'.split(
		"&"); //静态分类标识拼接
	const classes = class_name.map((ele, index) => {
		return {
			type_id: class_url[index],
			type_name: ele
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
	const link = (page == 1) ? url + `${tid}` : url + `${tid}list_${page}.html`
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
	xiyueta('.dpic').each(function() {
		const book_id = xiyueta(this).find('a:first').attr('href')
		if (!!book_id) {
			books.push({
				book_id: book_id,
				book_name: '',
				book_pic: url + xiyueta(this).find('img:first').attr('src')
			});
		}
	})
	const pagecount = xiyueta(".pagelist li:last").prev().find("a").text();
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
			book_name: '',
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
	let page = 2;
	for (let i = 1; i < page; i++) {
		const link = (i == 1) ? url + `${id}` : url + `${id}index_${i}.html`
		const html = await request(link);
		if (html === null) {
			return {
				content: content
			};
		}
		xiyueta.load(html)

		if (i == 1) {
			let npage = xiyueta(".viewnewpages a:last").prev().text();
			if (!!npage && npage > 2) {
				page = npage
			}
		}
		xiyueta('#content img').each(function() {
			const img = xiyueta(this).attr('src');
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
	return {
		list: [],
	};
}