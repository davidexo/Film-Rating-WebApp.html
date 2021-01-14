import test from '../../www-prog-extra/baretap/index.js';
import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';
import * as fs from 'fs/promises';
import http from 'http';

import createApp from '../app.js';
import { rejects } from 'assert';
import { JSDOM } from 'jsdom';

const origDB = './data/tracks.sqlite';
let db;

const hasElement = (dom, el) => {
	const found = Array.from(dom.window.document.querySelectorAll(el));
	return found.length > 0;
};

function makeRequest(uri, method = 'GET', options = {}) {
	return new Promise((resolve, reject) => {
		http.get(uri, (res) => {
			let data = [];
			res.on('data', (chunk) => {
				data.push(chunk);
			});
			res.on('end', async () => {
				res.body = data.join('');
				resolve(res);
			});
			res.on('aborted', () => {
				reject(new Error('Request aborted.'));
			});
			res.on('timeout', () => {
				reject(new Error('Request timed out.'));
			});
		});
	});
}

const port = 3456;
const host = `http://localhost:${port}`;
let server;
(async () => {
	const config = {
		port
	};

	server = await createApp(config);

	test('GET /fake123456789 => should return 404', async (t) => {
		const { headers, statusCode, body } = await makeRequest(host + '/fake123456789');
		t.equal(statusCode, 404, 'Status should be 404');
	});

	test('GET /hello => should return ›Hello World!‹', async (t) => {
		const { headers, statusCode, body } = await makeRequest(host + '/hello');
		t.equal(statusCode, 200, 'Status should be 200 OK');
		t.match(body, /hello world!?/i, 'Body should be: Hello World!');
	});

	test('GET /hello (text/html) => should return HTML', async (t) => {
		const { headers, statusCode, body } = await makeRequest(host + '/hello', 'GET', {
			headers: { accept: 'text/html' }
		});

		t.equal(statusCode, 200, 'Status should be 200 OK');
		t.match(headers['content-type'], /^text\/html/, 'Should be HTML');
	});

	test('GET /hello (text/html) => should contain some HTML', async (t) => {
		const { headers, statusCode, body } = await makeRequest(host + '/hello', 'GET', {
			headers: { accept: 'text/html' }
		});

		const dom = new JSDOM(body);

		t.ok(hasElement(dom, 'h1'), 'No <h1>');
	});
	/*
	test('GET /hello/welt => should return ›Hello welt!‹', async (t) => {
		const { headers, statusCode, body } = await makeRequest(host + '/hello/welt');
		t.equal(statusCode, 200, 'Status should be 200 OK');
		t.match(body, /hello welt!?/i, 'Body should be: Hello welt!');
	});

	test('GET /hello/flensburg => should return ›Hello Flensburg!‹', async (t) => {
		const { headers, statusCode, body } = await makeRequest(host + '/hello/flensburg');
		t.equal(statusCode, 200, 'Status should be 200 OK');
		t.match(body, /hello flensburg!?/i, 'Body should be: Hello Flensburg!');
	});
*/
	test.run();
})();
