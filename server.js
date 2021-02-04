//@ts-check

import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';
import webApp from './src/app.js';

const port = 3000;

(async () => {

	//open database
	const db =  await sqlite.open({
        filename: "./data/movies.sqlite",
        driver: sqlite3.Database });
	const config = { port,  db};
	await webApp(config);
})();
