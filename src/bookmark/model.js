//@ts-check
import {
  Database
} from "sqlite"; //　Klasse Database in diese Date importieren

/**
 *
 * @typedef Bookmark
 * @property {number} id
 * @property {string} uri
 * @property {string} title
 * @property {string} description
 * @property {string} date_created
 * @property {string} tags
 * @property {string} image
 * @property {number} amount_ratings
 * @property {number} rating
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
 (uri, title, description, tags, date_created, image)
 VALUES ($uri, $title, $description, $tags, $date, $image)`;

  const parameters = {
    $uri: bookmark.uri,
    $title: bookmark.title,
    $description: bookmark.description,
    $tags: bookmark.tags,
    $date: new Date(Date.now()).toISOString(),
    $image: bookmark.image
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
    const result = await db.run("UPDATE bookmarks SET title=?, uri=?, description=?, tags=?, date_created=?, image=? WHERE id = ?", 
    bookmark.title, bookmark.uri, bookmark.description, bookmark.tags, bookmark.date_created, bookmark.image, id);
    return result.changes;
  } else {
    console.log("There is no image");
    const result = await db.run("UPDATE bookmarks SET title=?, uri=?, description=?, tags=?, date_created=? WHERE id = ?", 
    bookmark.title, bookmark.uri, bookmark.description, bookmark.tags, bookmark.date_created, id);
    return result.changes;
  }
}

export async function updateRating (db, id, newRating) {
  console.log("Update Rating");

  const current = await db.get("SELECT rating, amount_ratings FROM bookmarks WHERE id = ?", id);
  console.table(current);
  const newAmountRatings = current.amount_ratings + 1;

  const averageRating = ((parseFloat(current.rating) + parseFloat(newRating)) / newAmountRatings);
  console.log(averageRating);

  const result = await db.run("UPDATE bookmarks SET rating=?, amount_ratings=? WHERE id = ?", averageRating, newAmountRatings, id);
  return result.changes;
}