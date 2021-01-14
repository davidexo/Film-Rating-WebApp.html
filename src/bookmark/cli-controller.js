//@ts-check
//Controller und Hilfsfunktionen zur Formatierung

import * as model from './model.js';
import {
  parse
} from 'path';
import * as fs from 'fs';
import {
  pathToFileURL
} from 'url';
import {
  Database
} from 'sqlite';
import { assert } from 'console';


/**
 * Die Funktion viewTeaser(bookmark) soll ein Bookmark für die Anzeige in der Liste formatieren
 *
 * @param {any} bookmark 
 * @return {string} -- Teaser information about entry
 */
export function viewTeaser(bookmark) {
  var string =
    `${bookmark.title} (${bookmark.id})
    ${bookmark.uri}
    ${formatTags(bookmark.tags)}
    ${bookmark.id}`;
  return string
}


/**
 * Die Funktion viewFull(bookmark) soll ein Bookmark für die Detail-Anzeige formatieren. Ein Anzeigebeispiel finden Sie weiter oben.
 *
 * @param {any} bookmark 
 * @return {string} -- Full Information about entry
 */
export function viewFull(bookmark) {

  var string =
    `${bookmark.title} (${bookmark.id})
    ${bookmark.description}
    ${bookmark.uri}
    ${bookmark.date_created}
    ${formatTags(bookmark.tags)}
    `;

  return string
}

/**
 * Die Funktion formatTags(tags) soll einen String mit Komma-getrennten Tags 
 * für die Ausgabe formatieren. Die einzelnen Tags sollen 
 * # als Prefix erhalten und mit dem Leerzeichen getrennt werden.
 *
 * @param {string} tags
 * @return {string} -- formatierte Tags
 */
export function formatTags(tags) {
  if (tags !== null) {
    var array = tags.split(',');
    array = array.map(element => `#${element}`);
    var string = array.join(' ');
    return string;
  } else {
    return 'Tags are null'
  }
}


/**
 * Die Funktion index(path) soll alle Bookmarks als formatierten String zurückliefern
 * @param {Database} db
 * @return {Promise<any>}
 */
export async function index(db) {
  var items = await model.all(db);

  if(items !== null) {
    var formatted = items.map(element => viewTeaser(element));
    var joined = formatted.join(', \n');
    return joined;
  } else {
    return 'Items are empty'
  }
}


/**
 * Die Funktion show(path, id) soll die Details eines Bookmarks als formatierter String zurückliefern
 * @param {Database} db
 * @param {string} id
 * @return {Promise<string>}
 */
export async function show(db, id) {
  assert(id !== undefined, 'Id is not defined');
  const item = await model.getById(db, id);
  return await viewFull(item)
}

export async function add(db, title, uri, ...tags) {
  //console.log("Args: " + title + " " + uri);
  //console.log("Tags: " + tags);

  if (title == undefined || uri == undefined) {
    return 'Bitte Titel und URI angeben.'
  }

  var testBm = {
    title,
    uri,
    description: "",
    tags: null
  }

  testBm = {
    title,
    uri,
    description: "",
    tags: tags
  }

  const result = await model.add(db, testBm);
  const resultAsNumber = result.toString();
  return resultAsNumber;
}

export async function deleteById(db, id) {
  
  if(id == undefined) {
    return('Bitte id angeben.');
  }

  const result = await model.deleteById(db, id);
  return result;
}