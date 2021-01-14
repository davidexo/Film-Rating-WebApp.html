//@ts-check

import { Database } from 'sqlite';
import * as controller from './bookmark/cli-controller.js';

const help = `
Usage:
------
node cli.js all –– show all bookmarks
node cli.js show HASH -- show bookmark with hash starting with HASH
`;

/**
 * Call the correct command and return output.
 *
 * @param {Database} db -- database
 * @param {string[]} argv -- all arguments from terminal
 *
 * @return {Promise<String>} -- String to print in the console by the CLI
 */
export default async function cliApp(db, argv) {

    const args = argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'all':
            //console.log("Führe all aus!");
            const allItems = await controller.index(db);
            const allItemsString = allItems.toString();
            return allItemsString;
        case 'delete':
            //console.log("Loeschen!");
            const idToDelete = args[1];
            return controller.deleteById(db, idToDelete);
        case 'show':
            //console.log("Führe show aus!");
            const idToShow = args[1];
            //console.log("ID: " + idToShow);

            const result = await controller.show(db, idToShow)
            return await result;
        case 'add':
            var tags;

            try{
                tags = args.slice(3,args.length);
            } catch {
                console.log("Slicing tags was not possible");
            }
            return controller.add(db, args[1], args[2], ...tags);
    }
    return help
}


/**
 *
 * @typedef ParsedArgv
 * @property {string} command - The command
 * @property {string[]} args - All other arguments
 */

/**
 *
 * @param {string[]} argv
 *
 * @return {ParsedArgv}
 */
export function parseArgv(argv) {
    var command = argv[2];
    var args = argv.slice(3);

    if (command == undefined) {
        command = 'help';
    }
    return {
        command,
        args
    }

}