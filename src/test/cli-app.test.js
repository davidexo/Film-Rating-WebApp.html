import test from '../../www-prog-extra/baretap/index.js';
import * as cliApp from '../cli-app.js';
import * as model from '../bookmark/model.js';
import * as controller from '../bookmark/cli-controller.js';
import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';
import * as fs from 'fs/promises';
import http from 'http';
import createApp from '../app.js';
import { JSDOM } from 'jsdom';

const origDB = './data/bookmarks.sqlite';
const testDB = './data/test-098f6bcd4621d373cade4e832627b4f6.sqlite';
let db, dbCopy;
const port = 3456;
const host = `http://localhost:${port}`;

async function openDB(path) {
	return await sqlite.open({ filename: path, driver: sqlite3.Database });
}

async function copyDB(from, to) {
	await fs.copyFile(from, to);
	return await sqlite.open({ filename: to, driver: sqlite3.Database });
}

async function removeDB(path) {
	await fs.rm(path);
}

const escapeHTML = (str) =>
	str.replace(
		/[&<>'"]/g,
		(entity) =>
			({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				"'": '&#39;',
				'"': '&quot;'
			}[entity] || entity)
	);

test('Open database', async function(t) {
	const stats = await fs.stat(origDB);
	t.ok(stats.isFile(), 'Database file missing.');
});

(async () => {
	db = await openDB(origDB);

	test('Model: getAll, check object keys', async function(t) {
		const data = await model.all(db);
		t.ok(Array.isArray(data), 'No array');
		t.ok(data.length > 2, 'Not enough entries');
		t.equal(typeof data[0], 'object', 'No array');
		const obj = data[0];
		t.ok('uri' in obj, 'uri missing');
		t.ok('title' in obj, 'title missing');
		t.ok('tags' in obj, 'tags missing');
		t.ok('id' in obj, 'id missing');
		t.ok('description' in obj, 'description missing');
	});
	test('Model: getAll, check some rows', async function(t) {
		const data = await model.all(db);
		t.ok(Array.isArray(data), 'No array');
		t.ok(data.length > 2, 'Not enough entries');
		t.equal(typeof data[0], 'object', 'No array');
		t.ok(data[0].uri, 'uri empty');
		t.ok(data[0].title, 'title empty');
		t.ok(data[0].id, 'id empty');
	});
	test('Model: getAall, check all rows', async function(t) {
		const data = await model.all(db);
		t.ok(Array.isArray(data), 'No array');
		t.ok(data.length > 2, 'Not enough entries');
		t.equal(typeof data[0], 'object', 'No array');
		for (const row of data) {
			t.ok(row.uri, 'uri empty');
			t.ok(row.title, 'title empty');
			t.ok(row.id, 'id empty');
		}
	});
	test('Model: getById, check data', async function(t) {
		const data = await model.all(db);
		const row = data[1];
		const testRow = await model.getById(db, row.id);
		t.equal(row.id, testRow.id);
		t.equal(row.title, testRow.title);
		t.equal(row.uri, testRow.uri);
	});

	dbCopy = await copyDB(origDB, testDB);

	test('Model: Insert data', async function(t) {
		const lastId = await model.add(dbCopy, {
			uri: 'https://crocks.dev',
			title: 'Test Crocks',
			description: undefined,
			date_created: undefined,
			tags: 'js,fp,programming,monad'
		});
		t.ok(lastId != undefined, 'lastId is undefined');
		t.equal(typeof lastId, 'number', 'lastId should be number');
	});
	test('Model: Insert data & getById', async function(t) {
		const data = {
			uri: 'https://example.dev',
			title: 'Test #2',
			description: 'a long text',
			date_created: undefined,
			tags: 'test'
		};
		const lastId = await model.add(dbCopy, data);
		t.ok(lastId != undefined, 'lastId is undefined');
		t.equal(typeof lastId, 'number', 'lastId should be number');
		t.ok(lastId > 0, 'lastId should be > 0');
		const testRow = await model.getById(dbCopy, lastId);
		t.equal(testRow.id, lastId);
		t.equal(testRow.title, data.title);
		t.equal(testRow.uri, data.uri);
		t.equal(testRow.tags, data.tags);
		t.equal(testRow.description, data.description);
		t.match(testRow.date_created, /\d{4}-\d{2}-\d{2}/);
	});
	test('Model: Insert data & deleteById', async function(t) {
		const data = {
			uri: 'https://delete.null',
			title: 'Delete',
			description: 'a long text',
			date_created: undefined,
			tags: 'test'
		};
		const lastId = await model.add(dbCopy, data);
		t.ok(lastId != undefined, 'lastId is undefined');
		t.equal(typeof lastId, 'number', 'lastId should be number');
		t.ok(lastId > 0, 'lastId should be > 0');
		const testRow = await model.getById(dbCopy, lastId);
		t.equal(testRow.id, lastId);
		t.equal(testRow.title, data.title);
		t.equal(testRow.uri, data.uri);
		t.equal(testRow.tags, data.tags);
		t.equal(testRow.description, data.description);
		t.match(testRow.date_created, /\d{4}-\d{2}-\d{2}/);
		const changed = await model.deleteById(dbCopy, lastId);
		t.equal(typeof changed, 'number', 'changed should be number');
		t.ok(changed > 0, 'changed should be > 0');
		const deletedRow = await model.getById(dbCopy, lastId);
		t.equal(deletedRow, undefined, 'Row should be non-exisiting');
	});

	function makeRequest(path, method = 'GET', _options = {}, postData) {
		const options = {
			protocol: 'http:',
			hostname: 'localhost',
			port: port,
			path: path,
			method: method,
			headers: {
				'Content-Type': 'text/html'
			},
			..._options
		};
		return new Promise((resolve, reject) => {
			const req = http.request(options, (res) => {
				let data = [];

				res.on('data', (chunk) => {
					data.push(chunk);
				});
				res.on('end', async () => {
					res.body = data.join('');
					//console.log(res.statusCode);
					//console.log(res.headers);
					resolve(res);
				});
				res.on('aborted', () => {
					console.error('aborted');
					reject(new Error('Request aborted.'));
				});
				res.on('timeout', () => {
					console.error('timeout');
					reject(new Error('Request timed out.'));
				});
			});
			if (method == 'POST') {
				req.write(postData);
			}
			req.end();
		});
	}

	let server;

	const config = {
		db: dbCopy,
		port
	};
	//console.log(config);

	server = await createApp(config);

	function parse(data) {
		try {
			const json = JSON.parse(data);
			return json;
		} catch (err) {
			console.error(err);
			return undefined;
		}
	}

	test('GET /randomurixyz93847tfh38 => should return 404 OK', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/randomurixyz93847tfh38', 'GET', {
			headers: { accept: 'application/json' }
		});
		t.equal(statusCode, 404, 'Status should be 404 OK');
	});
	test('GET / => should return 200 OK', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'application/json' }
		});
		t.equal(statusCode, 200, 'Status should be 200 OK');
	});
	test('GET /bookmark/ID => should return 200 OK', async (t) => {
		const data = await model.all(dbCopy);
		const row = data[1];
		const { headers, statusCode, body } = await makeRequest('/bookmark/' + row.id, 'GET', {
			headers: { accept: 'application/json' }
		});
		t.equal(statusCode, 200, 'Status should be 200 OK');
	});

	test('GET / (application/json) => should return bookmarks as JSON', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'application/json' }
		});

		t.equal(statusCode, 200, 'Status should be 200 OK');
		const json = parse(body);
		t.ok(Array.isArray(json), 'Should be JSON array');
	});

	test('GET / => check object keys', async function(t) {
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'application/json' }
		});

		t.equal(statusCode, 200, 'Status should be 200 OK');
		const data = parse(body);
		t.ok(Array.isArray(data), 'No array');
		t.ok(data.length > 2, 'Not enough entries');
		t.equal(typeof data[0], 'object', 'No array');
		const obj = data[0];
		t.ok('uri' in obj, 'uri missing');
		t.ok('title' in obj, 'title missing');
		t.ok('tags' in obj, 'tags missing');
		t.ok('id' in obj, 'id missing');
		t.ok('description' in obj, 'description missing');
	});
	test('GET / => check some rows', async function(t) {
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'application/json' }
		});

		t.equal(statusCode, 200, 'Status should be 200 OK');
		const data = parse(body);
		t.ok(Array.isArray(data), 'No array');
		t.ok(data.length > 2, 'Not enough entries');
		t.equal(typeof data[0], 'object', 'No array');
		t.ok(data[0].uri, 'uri empty');
		t.ok(data[0].title, 'title empty');
		t.ok(data[0].id, 'id empty');
	});
	test('GET / => check all rows', async function(t) {
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'application/json' }
		});

		t.equal(statusCode, 200, 'Status should be 200 OK');
		const data = parse(body);
		t.ok(Array.isArray(data), 'No array');
		t.ok(data.length > 2, 'Not enough entries');
		t.equal(typeof data[0], 'object', 'No array');
		for (const row of data) {
			t.ok(row.uri, 'uri empty');
			t.ok(row.title, 'title empty');
			t.ok(row.id, 'id empty');
		}
	});

	test('GET /bookmark/ID (application/json) => should return a bookmark as JSON', async (t) => {
		const data = await model.all(db);
		const row = data[1];
		const { headers, statusCode, body } = await makeRequest('/bookmark/' + row.id, 'GET', {
			headers: { accept: 'application/json' }
		});

		t.equal(statusCode, 200, 'Status should be 200 OK');
		const json = parse(body);
		t.equal(typeof json, 'object', 'Should be JSON object');
		t.ok(!Array.isArray(json), 'Should be JSON object');
	});

	test('GET /bookmark/ID, check data', async function(t) {
		const data = await model.all(db);
		const row = data[1];
		const testRow = await model.getById(db, row.id);
		const { headers, statusCode, body } = await makeRequest('/bookmark/' + row.id, 'GET', {
			headers: { accept: 'application/json' }
		});
		const json = parse(body);
		t.equal(json.id, testRow.id);
		t.equal(json.title, testRow.title);
		t.equal(json.uri, testRow.uri);
	});

	test('GET /bookmark/fakeid999 => should return 404', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/bookmark/fakeid999', 'GET', {
			headers: { accept: 'application/json' }
		});
		t.equal(statusCode, 404, 'Status should be 404');
	});

	test('DELETE /bookmark/ID => should be deleted', async (t) => {
		const data = {
			uri: 'https://delete.dev',
			title: 'Test to delete',
			description: 'a long text, soon to be deleted',
			date_created: undefined,
			tags: 'test'
		};
		const lastId = await model.add(dbCopy, data);
		t.ok(lastId != undefined, 'lastId is undefined');
		t.equal(typeof lastId, 'number', 'lastId should be number');
		t.ok(lastId > 0, 'lastId should be > 0');
		const { headers: headers2, statusCode: statusCode2, body: body2 } = await makeRequest(
			'/bookmark/' + lastId,
			'DELETE',
			{
				headers: {
					accept: 'application/json'
				}
			}
		);
		const testbm = await model.getById(dbCopy, lastId);
		t.equal(testbm, undefined, 'Bookmark from db should be undefined');
	});

	test('DELETE /bookmark/ID => should return 204', async (t) => {
		const data = {
			uri: 'https://delete.dev',
			title: 'Test to delete',
			description: 'a long text, soon to be deleted',
			date_created: undefined,
			tags: 'test'
		};
		const lastId = await model.add(dbCopy, data);
		t.ok(lastId != undefined, 'lastId is undefined');
		t.equal(typeof lastId, 'number', 'lastId should be number');
		t.ok(lastId > 0, 'lastId should be > 0');
		const { headers: headers2, statusCode: statusCode2, body: body2 } = await makeRequest(
			'/bookmark/' + lastId,
			'DELETE',
			{
				headers: {
					accept: 'application/json'
				}
			}
		);
		t.equal(statusCode2, 204, 'Status should be 204');
	});

	test('POST /bookmark/add w/o data (application/json) => should return 400', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: { accept: 'application/json' }
			},
			''
		);
		t.equal(statusCode, 400, 'Status should be 400');
	});

	test('POST /bookmark/add w/ damaged data (application/json) => should return 400', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: { accept: 'application/json' }
			},
			JSON.stringify({
				uri: '',
				title: '',
				description:
					'Koa is a new web framework designed by the team behind Express, which aims to be a smaller, more expressive, and more robust foundation for web applications and APIs.'
			})
		);
		t.equal(statusCode, 400, 'Status should be 400');
	});

	test('POST /bookmark/add w/ data (application/json) => should return 201', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'application/json',
					'Content-Type': 'application/json'
				}
			},
			JSON.stringify({
				uri: 'http://example.com',
				title: 'Test',
				description:
					'Koa is a new web framework designed by the team behind Express, which aims to be a smaller, more expressive, and more robust foundation for web applications and APIs.'
			})
		);
		t.equal(statusCode, 201, 'Status should be 201');
	});

	test('POST /bookmark/add w/ data (application/json) => should return JSON object', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'application/json',
					'Content-Type': 'application/json'
				}
			},
			JSON.stringify({
				uri: 'http://example.com',
				title: 'Test',
				description:
					'Koa is a new web framework designed by the team behind Express, which aims to be a smaller, more expressive, and more robust foundation for web applications and APIs.'
			})
		);
		const json = parse(body);
		t.equal(statusCode, 201, 'Status should be 201');
		t.equal(typeof json, 'object', 'Should be JSON object');
		t.ok(!Array.isArray(json), 'Should be JSON object');
	});

	test('POST /bookmark/add w/ data (application/json) => should return new bookmark', async (t) => {
		const bookmark = {
			uri: 'http://example123.com',
			title: 'Test45678',
			description:
				'Koa is a new web framework designed by the team behind Express, which aims to be a smaller, more expressive, and more robust foundation for web applications and APIs.'
		};
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'application/json',
					'Content-Type': 'application/json'
				}
			},
			JSON.stringify(bookmark)
		);
		const json = parse(body);
		t.equal(statusCode, 201, 'Status should be 201');
		t.equal(typeof json, 'object', 'Should be JSON object');
		t.ok(!Array.isArray(json), 'Should be JSON object');
		t.equal(typeof Number(json.id), 'number', 'Id should be number');
		const jsonNew = await model.getById(dbCopy, Number(json.id));
		t.equal(typeof jsonNew, 'object', 'Db response should be JSON object');
		t.equal(jsonNew.id, json.id, 'Response and db item should be equal');
		t.equal(jsonNew.title, bookmark.title, 'Response and db item should be equal');
		t.equal(jsonNew.uri, bookmark.uri, 'Response and db item should be equal');
		t.equal(jsonNew.description, bookmark.description, 'Response and db item should be equal');
	});

	/***** HTML */

	test('GET / (text/html) => should return bookmarks as HTML', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'text/html' }
		});

		t.equal(statusCode, 200, 'Status should be 200 OK');
		t.match(headers['content-type'], /^text\/html/, 'Should be HTML');
	});

	test('GET / (text/html) => should return data of all bookmarks', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'text/html' }
		});
		const data = await model.all(db);

		for (const row of data) {
			t.ok(body.indexOf(escapeHTML(row.uri)) != -1, 'URI missing: ' + row.uri);
			t.ok(body.indexOf(escapeHTML(row.title)) != -1, 'Title missing: ' + row.title);
		}
	});

	const hasElement = (dom, el) => {
		const found = Array.from(dom.window.document.querySelectorAll(el));
		return found.length > 0;
	};

	const getValue = (dom, el) => {
		const found = dom.window.document.querySelector(el);
		return found.value;
	};

	test('GET / (text/html) => should contain some HTML', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'text/html' }
		});
		const dom = new JSDOM(body);
		t.ok(hasElement(dom, 'h1'), 'No <h1>');
		t.ok(hasElement(dom, 'ul'), 'No list');
		t.ok(hasElement(dom, 'ul>li'), 'No list items');
		t.ok(hasElement(dom, 'ul a'), 'No links in list');
	});

	test('GET / (text/html) => <script> should ecaped', async (t) => {
		const data = {
			uri: 'https://delete.dev',
			title: '<script src="12345.js">alert();</script>',
			description: '<script>alert();</script>'
		};
		const lastId = await model.add(dbCopy, data);
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'text/html' }
		});
		const dom = new JSDOM(body);
		t.ok(!hasElement(dom, 'script[src="12345.js"]'), 'Unescaped script tag. ** USE AUTOESCAPEING! **');
	});

	test('GET / (text/html) => should contain HTML Structure', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'text/html' }
		});
		const dom = new JSDOM(body);
		t.ok(hasElement(dom, 'html'), 'No <html>');
		t.ok(hasElement(dom, 'head'), 'No <head>');
		t.ok(hasElement(dom, 'head title'), 'No <title>');
		t.ok(hasElement(dom, 'body'), 'No <body>');
		t.ok(hasElement(dom, 'main'), 'No <main>');
		t.ok(hasElement(dom, 'main h1'), 'No <h1> in main');
		t.ok(hasElement(dom, 'main ul'), 'No list in main');
		t.ok(hasElement(dom, 'main ul>li'), 'No list items  in main');
		t.ok(hasElement(dom, 'main ul a'), 'No links in list  in main');
	});

	test('GET /bookmark/ID (text/html) => should return bookmark as HTML', async (t) => {
		const data = await model.all(db);
		const row = data[1];
		const { headers, statusCode, body } = await makeRequest('/bookmark/' + row.id, 'GET', {
			headers: { accept: 'text/html' }
		});

		t.equal(statusCode, 200, 'Status should be 200 OK');
		t.match(headers['content-type'], /^text\/html/, 'Should be HTML');
	});

	test('GET /bookmark/ID (text/html) => should return bookmark data', async (t) => {
		const data = await model.all(dbCopy);
		const row = data[1];
		const { headers, statusCode, body } = await makeRequest('/bookmark/' + row.id, 'GET', {
			headers: { accept: 'text/html' }
		});

		t.ok(body.indexOf(row.uri) != -1, 'URI missing: ' + row.uri);
		t.ok(body.indexOf(row.title) != -1, 'Title missing: ' + row.title);
		if (row.tags) t.ok(body.indexOf(row.tags) != -1, 'Tags missing: ' + row.tags);
		if (row.description) t.ok(body.indexOf(row.description) != -1, 'Description missing: ' + row.description);
	});

	test('GET /bookmark/ID (text/html) => should contain some HTML', async (t) => {
		const data = await model.all(dbCopy);
		const row = data[1];
		const { headers, statusCode, body } = await makeRequest('/bookmark/' + row.id, 'GET', {
			headers: { accept: 'text/html' }
		});
		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'main'), 'No <main>');
		t.ok(hasElement(dom, 'main h1, main h2'), 'No <h1> or <h2>');
		t.ok(hasElement(dom, 'main a'), 'No links in bookmark');
		t.ok(hasElement(dom, 'main a[href*="/edit"]'), 'No link to edit');
		t.ok(hasElement(dom, 'main a[href*="/delete"]'), 'No link to delete');
	});

	test('GET /bookmark/ID/delete (text/html) => should return confirm form as HTML', async (t) => {
		const data = await model.all(dbCopy);
		const row = data[1];
		const { headers, statusCode, body } = await makeRequest('/bookmark/' + row.id + '/delete', 'GET', {
			headers: { accept: 'text/html' }
		});

		t.equal(statusCode, 200, 'Status should be 200 OK');
		t.match(headers['content-type'], /^text\/html/, 'Should be HTML');
	});

	test('GET /bookmark/ID/delete (text/html) => should contain some HTML', async (t) => {
		const data = await model.all(dbCopy);
		const row = data[1];
		const { headers, statusCode, body } = await makeRequest('/bookmark/' + row.id + '/delete', 'GET', {
			headers: { accept: 'text/html' }
		});
		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'main'), 'No <main>');
		t.ok(hasElement(dom, 'main form'), 'No form');
		t.ok(hasElement(dom, 'main form[method="post"]'), 'No form with POST');
		t.ok(hasElement(dom, 'main button[type="submit"], main input[type="submit"]'), 'No submit button');
		t.ok(hasElement(dom, 'main a[href*="/bookmark/"]'), 'No link to bookmark');
	});

	/**** FORM */

	test('GET /bookmark/add (text/html) => should return form as HTML', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/bookmark/add', 'GET', {
			headers: { accept: 'text/html' }
		});

		t.equal(statusCode, 200, 'Status should be 200 OK');
		t.match(headers['content-type'], /^text\/html/, 'Should be HTML');
	});

	test('GET /bookmark/add (text/html) => should contain some HTML', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/bookmark/add', 'GET', {
			headers: { accept: 'text/html' }
		});

		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'main'), 'No <main>');
		t.ok(hasElement(dom, 'main form'), 'No form');
		t.ok(hasElement(dom, 'main form[method="post"]'), 'No form with POST');
		t.ok(hasElement(dom, 'main button[type="submit"], main input[type="submit"]'), 'No submit button');
		t.ok(hasElement(dom, 'main input[name="title"], main input[name="form[title]"]'), 'No text field for title');
		t.ok(hasElement(dom, 'main input[name="uri"], main input[name="form[uri]"]'), 'No text field for uri');
		t.ok(hasElement(dom, 'main input[name="tags"], main input[name="form[tags]"]'), 'No text field for tags');
		t.ok(
			hasElement(dom, 'main textarea[name="description"], main textarea[name="form[description]"]'),
			'No text area for description'
		);
		t.ok(hasElement(dom, 'main form label'), 'No <label>s');
	});

	test('GET / => should contain navigation', async (t) => {
		const { headers, statusCode, body } = await makeRequest('/', 'GET', {
			headers: { accept: 'text/html' }
		});

		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'nav'), 'No <nav>');
		t.ok(hasElement(dom, 'nav a'), 'No links in <nav>');
		t.ok(hasElement(dom, 'nav a[href="/"]'), 'No links to /');
		t.ok(hasElement(dom, 'nav a[href="/bookmark/add"]'), 'No links to add form');
	});

	test('GET /bookmark/ID => should contain navigation', async (t) => {
		const data = await model.all(dbCopy);
		const row = data[1];
		const { headers, statusCode, body } = await makeRequest('/bookmark/' + row.id, 'GET', {
			headers: { accept: 'text/html' }
		});

		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'nav'), 'No <nav>');
		t.ok(hasElement(dom, 'nav a'), 'No links in <nav>');
		t.ok(hasElement(dom, 'nav a[href="/"]'), 'No links to /');
		t.ok(hasElement(dom, 'nav a[href="/bookmark/add"]'), 'No links to add form');
	});

	/*** FORM */

	test('POST /bookmark/add w/ JSON data => should return JSON object', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'application/json',
					'Content-Type': 'application/json'
				}
			},
			JSON.stringify({
				uri: 'http://example.com',
				title: 'Test',
				description:
					'Koa is a new web framework designed by the team behind Express, which aims to be a smaller, more expressive, and more robust foundation for web applications and APIs.'
			})
		);
		const json = parse(body);
		t.equal(statusCode, 201, 'Status should be 201');
		t.equal(typeof json, 'object', 'Should be JSON object');
		t.ok(!Array.isArray(json), 'Should be JSON object');
	});

	function encodeObject(data) {
		const params = new URLSearchParams(data);
		return params.toString();
	}

	test('POST /bookmark/add w/ form data => should return HTML', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject({
				uri: 'http://example.com',
				title: 'Test',
				description:
					'Koa is a new web framework designed by the team behind Express, which aims to be a smaller, more expressive, and more robust foundation for web applications and APIs.'
			})
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
	});

	test('POST /bookmark/add w/ empty form data => should return form', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject({})
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'main'), 'No <main>');
		t.ok(hasElement(dom, 'main form'), 'No form');
		t.ok(hasElement(dom, 'main form[method="post"]'), 'No form with POST');
		t.ok(hasElement(dom, 'main button[type="submit"], main input[type="submit"]'), 'No submit button');
		t.ok(hasElement(dom, 'main input[name="title"], main input[name="form[title]"]'), 'No text field for title');
		t.ok(hasElement(dom, 'main input[name="uri"], main input[name="form[uri]"]'), 'No text field for uri');
		t.ok(hasElement(dom, 'main input[name="tags"], main input[name="form[tags]"]'), 'No text field for tags');
		t.ok(
			hasElement(dom, 'main textarea[name="description"], main textarea[name="form[description]"]'),
			'No text area for description'
		);
		t.ok(hasElement(dom, 'main form label'), 'No <label>s');
	});

	test('POST /bookmark/add w/ short title => should return form', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject({ title: 'a' })
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'main'), 'No <main>');
		t.ok(hasElement(dom, 'main form'), 'No form');
		t.ok(hasElement(dom, 'main form[method="post"]'), 'No form with POST');
		t.ok(hasElement(dom, 'main button[type="submit"], main input[type="submit"]'), 'No submit button');
		t.ok(hasElement(dom, 'main input[name="title"], main input[name="form[title]"]'), 'No text field for title');
		t.ok(hasElement(dom, 'main input[name="uri"], main input[name="form[uri]"]'), 'No text field for uri');
		t.ok(hasElement(dom, 'main input[name="tags"], main input[name="form[tags]"]'), 'No text field for tags');
		t.ok(
			hasElement(dom, 'main textarea[name="description"], main textarea[name="form[description]"]'),
			'No text area for description'
		);
		t.ok(hasElement(dom, 'main form label'), 'No <label>s');
	});

	test('POST /bookmark/add w/ malformed uri => should return form', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject({ title: 'at least 3 chars', uri: 'this/is/not:an.uri' })
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'main'), 'No <main>');
		t.ok(hasElement(dom, 'main form'), 'No form');
		t.ok(hasElement(dom, 'main form[method="post"]'), 'No form with POST');
		t.ok(hasElement(dom, 'main button[type="submit"], main input[type="submit"]'), 'No submit button');
		t.ok(hasElement(dom, 'main input[name="title"], main input[name="form[title]"]'), 'No text field for title');
		t.ok(hasElement(dom, 'main input[name="uri"], main input[name="form[uri]"]'), 'No text field for uri');
		t.ok(hasElement(dom, 'main input[name="tags"], main input[name="form[tags]"]'), 'No text field for tags');
		t.ok(
			hasElement(dom, 'main textarea[name="description"], main textarea[name="form[description]"]'),
			'No text area for description'
		);
		t.ok(hasElement(dom, 'main form label'), 'No <label>s');
	});

	test('POST /bookmark/add w/ title => should return form with title', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject({ title: '3894tu9hg7g90' })
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'main input[name="title"], main input[name="form[title]"]'), 'No text field for title');
		t.equal(getValue(dom, 'main input[name="title"], main input[name="form[title]"]'), '3894tu9hg7g90');
	});

	test('POST /bookmark/add w/ uri => should return form with uri', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject({ uri: '459g8n3934hgoelbvi384' })
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'main input[name="uri"], main input[name="form[uri]"]'), 'No text field for title');
		t.equal(getValue(dom, 'main input[name="uri"], main input[name="form[uri]"]'), '459g8n3934hgoelbvi384');
	});

	test('POST /bookmark/add w/ description => should return form with description', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject({ description: 'rt984thguwogho378gg5' })
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		const dom = new JSDOM(body);

		t.ok(
			hasElement(dom, 'main textarea[name="description"], main textarea[name="form[description]"]'),
			'No text field for title'
		);
		t.equal(
			getValue(dom, 'main textarea[name="description"], main textarea[name="form[description]"]'),
			'rt984thguwogho378gg5'
		);
	});

	test('POST /bookmark/add w/ tags => should return form with tags', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject({ tags: 'rt98,4thgu,wogho,378,gg5' })
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'main input[name="tags"], main input[name="form[tags]"]'), 'No text field for title');
		t.equal(getValue(dom, 'main input[name="tags"], main input[name="form[tags]"]'), 'rt98,4thgu,wogho,378,gg5');
	});

	test('POST /bookmark/add w/ bookmark => should redirect', async (t) => {
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject({
				uri: 'http://example.com',
				title: 'Testgm38g420598gh37q3h45g9783zre',
				description:
					'Koa is a new web framework designed by the team behind Express, which aims to be a smaller, more expressive, and more robust foundation for web applications and APIs.'
			})
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		t.ok(statusCode == 301 || statusCode == 302 || statusCode == 307, 'Redirect missing');
	});

	async function findByTitle(db, title) {
		const sql = `SELECT * FROM bookmarks
		WHERE title = $id`;
		const data = await db.get(sql, { $id: title });
		return data;
	}

	const bookmark = {
		uri: 'http://example.com',
		title: 'Testg5948gjughriughriuw',
		description:
			'Koa is a new web framework designed by the team behind Express, which aims to be a smaller, more expressive, and more robust foundation for web applications and APIs.',
		tags: 'abc,def'
	};

	test('POST /bookmark/add w/ bookmark => bookmark should be in db', async (t) => {
		const before = await findByTitle(dbCopy, bookmark.title);
		t.equal(before, undefined, 'Entry should be non-exisiting');
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/add',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject(bookmark)
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		t.ok(statusCode == 301 || statusCode == 302 || statusCode == 307, 'Redirect missing');
		const after = await findByTitle(dbCopy, bookmark.title);
		t.ok(after, 'Entry should be exisiting now');
		t.equal(after.title, bookmark.title);
		t.equal(after.uri, bookmark.uri);
		t.equal(after.description, bookmark.description);
		t.equal(after.tag, bookmark.tag);
	});

	test('GET /bookmark/ID/edit  => bookmark data should be in a form', async (t) => {
		const before = await findByTitle(dbCopy, bookmark.title);
		t.ok(before, 'Entry should be exisiting');
		const { headers, statusCode, body } = await makeRequest('/bookmark/' + before.id + '/edit', 'GET', {
			headers: {
				accept: 'text/html',
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'main'), 'No <main>');
		t.ok(hasElement(dom, 'main form'), 'No form');
		t.ok(hasElement(dom, 'main form[method="post"]'), 'No form with POST');
		t.ok(hasElement(dom, 'main button[type="submit"], main input[type="submit"]'), 'No submit button');
		t.ok(hasElement(dom, 'main input[name="title"], main input[name="form[title]"]'), 'No text field for title');
		t.ok(hasElement(dom, 'main input[name="uri"], main input[name="form[uri]"]'), 'No text field for uri');
		t.ok(hasElement(dom, 'main input[name="tags"], main input[name="form[tags]"]'), 'No text field for tags');
		t.ok(
			hasElement(dom, 'main textarea[name="description"], main textarea[name="form[description]"]'),
			'No text area for description'
		);
		t.ok(hasElement(dom, 'main form label'), 'No <label>s');

		t.equal(
			getValue(dom, 'main input[name="title"], main input[name="form[title]"]'),
			bookmark.title,
			'Title  missing'
		);
		t.equal(getValue(dom, 'main input[name="uri"], main input[name="form[uri]"]'), bookmark.uri, 'Uri  missing');
		t.equal(
			getValue(dom, 'main textarea[name="description"], main textarea[name="form[description]"]'),
			bookmark.description,
			'Description missing'
		);
		t.equal(
			getValue(dom, 'main input[name="tags"], main input[name="form[tags]"]'),
			bookmark.tags,
			'Tags  missing'
		);
	});

	test('POST /bookmark/ID/edit  /w new data => new data should be in database', async (t) => {
		const newdata = {
			uri: 'http://example2.com',
			title: 'Testg5948gjughriughriuw',
			description: 'No Description',
			tags: 'abc,def,ghi'
		};
		const before = await findByTitle(dbCopy, bookmark.title);
		t.ok(before, 'Entry should be exisiting');
		const { headers, statusCode, body } = await makeRequest(
			'/bookmark/' + before.id + '/edit',
			'POST',
			{
				headers: {
					accept: 'text/html',
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			},
			encodeObject(newdata)
		);
		t.equal(headers['content-type'].indexOf('text/html'), 0, 'Content type should be HTML');
		const after = await findByTitle(dbCopy, bookmark.title);
		t.ok(after, 'Entry should be exisiting');
		t.equal(after.title, bookmark.title);
		t.equal(after.uri, newdata.uri);
		t.equal(after.description, newdata.description);
		t.equal(after.tag, bookmark.tag);
	});
	test.run();
	test.after(async function(t) {
		if (db) {
			await db.close();
		}
		if (dbCopy) {
			await dbCopy.close();
		}
		await removeDB(testDB);
	});
})();
