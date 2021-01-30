//@ts-check
import {
  Database
} from "sqlite"; //　Klasse Database in diese Date importieren

/**
 *
 * @typedef Bookmark
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} release
 * @property {string} tags
 * @property {string} image
 * @property {number} total_rating
 * @property {number} rating
 * @property {string} imdb
 * @property {string} rottentomatoes
 * 
 */

/**
 * This function return all objects from a JSON file
 *
 * @param {Database} db -- database
 * @return {Promise<*[]>}
 */
export async function all(db) {
  return await db.all("SELECT * FROM bookmarks");
}

/**
 *
 * @param {Database} db // Pfad zum Datenbankobjekt
 * @param {String} id // Gesuchte Id
 *
 * @return {Promise<Bookmark>}
 */
export async function getById(db, id) {
  return await db.get("SELECT * FROM bookmarks WHERE id = ?", id);
  }

export async function add(db, bookmark) {
  const sql = `INSERT INTO bookmarks
 (title, description, tags, release, image, imdb, rottentomatoes)
 VALUES ($title, $description, $tags, $date, $image, $imdb, $rottentomatoes)`;

  const parameters = {
    $title: bookmark.title,
    $description: bookmark.description,
    $tags: bookmark.tags,
    $date: new Date(Date.now()).toISOString(),
    $image: bookmark.image,
    $imdb: bookmark.imdb,
    $rottentomatoes: bookmark.rottentomatoes
  };

  const result = await db.run(sql, parameters);
  return result.lastID;
}

export async function deleteById(db, id) {
  const sql = `DELETE FROM bookmarks WHERE id=$id`;
  const result = await db.run(sql, {
    $id: id
  });
  return result.changes;
}

/**
 * Bearbeitet ein Bookmark in der Datenbank
 *
 * @param {Database} db // Datenbankobjekt
 * @param {number} id // Id des Bookmarks
 * @param {Bookmark} bookmark // Bookmark-Daten
 *
 * @return {Promise<number>}
 */
export async function update (db, id, bookmark) {
  if(bookmark.image) {
    console.log("There is an image");
    const result = await db.run("UPDATE bookmarks SET title=?, description=?, tags=?, release=?, image=?, imdb=?, rottentomatoes=? WHERE id = ?", 
    bookmark.title, bookmark.description, bookmark.tags, bookmark.release, bookmark.image, bookmark.imdb, bookmark.rottentomatoes, id);
    return result.changes;
  } else {
    console.log("There is no image");
    const result = await db.run("UPDATE bookmarks SET title=?, description=?, tags=?, release=?, imdb=?, rottentomatoes=? WHERE id = ?", 
    bookmark.title, bookmark.description, bookmark.tags, bookmark.release, bookmark.imdb, bookmark.rottentomatoes, id);
    return result.changes;
  }
}

export async function updateRating (db, id, rating) {

  // get entry in database
  const current = await db.get("SELECT rating, total_rating FROM bookmarks WHERE id = ?", id);
  
  var overallRating = parseFloat(current.rating);
  var totalRating = parseFloat(current.total_rating);
  var newRating = parseFloat(rating);

  // calculate new rating
  const newOverallRating = ((overallRating * totalRating) + newRating) / (totalRating + 1);
  console.log("New Overallrating: " + newOverallRating);
  
  const result = await db.run("UPDATE bookmarks SET rating=?, total_rating=? WHERE id = ?", newOverallRating, (totalRating+newRating), id);
  return result.changes;
}