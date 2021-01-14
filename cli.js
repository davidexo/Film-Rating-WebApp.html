//@ts-check

import cliApp from './src/cli-app.js';
import * as sqlite from 'sqlite';
import sqlite3 from 'sqlite3';

/**
 * Call the commandline app async and print the result.
 * Use an IIFE to avoid top-level await.
 */

(async () => {
	const db =  await sqlite.open({
        filename: "./data/bookmarks.sqlite",
        driver: sqlite3.Database });
        process.stdout.write(await cliApp(db, process.argv) + '<--- PROCESS AUSGABE \n');
})();
