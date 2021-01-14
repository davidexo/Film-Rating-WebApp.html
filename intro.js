import { INSPECT_MAX_BYTES } from 'buffer';
import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';
import * as model from './src/bookmark/model.js';

/**
 *
 * @param {string} path - the path to the database
 * =>
 * @returns {*[]} - array of database rows
 */
export async function index(path) {

	var db = await sqlite.open({
		filename: path,
		driver: sqlite3.Database
	});

	var items = await db.all("SELECT * FROM tracks ORDER BY Name");

	return items
}

(async () => {
	const data = await index('./data/tracks.sqlite');
	console.table(data);
})();