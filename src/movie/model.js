//@ts-check
import {
  Database
} from "sqlite"; //　Klasse Database in diese Date importieren

/**
 *
 * @typedef movie
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
  return await db.all("SELECT * FROM movies");
}

/**
 *
 * @param {Database} db // Pfad zum Datenbankobjekt
 * @param {String} id // Gesuchte Id
 *
 * @return {Promise<movie>}
 */
export async function getById(db, id) {
  return await db.get("SELECT * FROM movies WHERE id = ?", id);
  }

export async function add(db, movie) {
  const sql = `INSERT INTO movies
 (title, description, tags, release, image, imdb, rottentomatoes)
 VALUES ($title, $description, $tags, $date, $image, $imdb, $rottentomatoes)`;

  const parameters = {
    $title: movie.title,
    $description: movie.description,
    $tags: movie.tags,
    $date: new Date(Date.now()).toISOString(),
    $image: movie.image,
    $imdb: movie.imdb,
    $rottentomatoes: movie.rottentomatoes
  };

  const result = await db.run(sql, parameters);
  return result.lastID;
}

export async function deleteById(db, id) {
  const sql = `DELETE FROM movies WHERE id=$id`;
  const result = await db.run(sql, {
    $id: id
  });
  return result.changes;
}

/**
 * Bearbeitet ein movie in der Datenbank
 *
 * @param {Database} db // Datenbankobjekt
 * @param {number} id // Id des movies
 * @param {movie} movie // movie-Daten
 *
 * @return {Promise<number>}
 */
export async function update (db, id, movie) {
  if(movie.image) {
    console.log("There is an image");
    const result = await db.run("UPDATE movies SET title=?, description=?, tags=?, release=?, image=?, imdb=?, rottentomatoes=? WHERE id = ?", 
    movie.title, movie.description, movie.tags, movie.release, movie.image, movie.imdb, movie.rottentomatoes, id);
    return result.changes;
  } else {
    console.log("There is no image");
    const result = await db.run("UPDATE movies SET title=?, description=?, tags=?, release=?, imdb=?, rottentomatoes=? WHERE id = ?", 
    movie.title, movie.description, movie.tags, movie.release, movie.imdb, movie.rottentomatoes, id);
    return result.changes;
  }
}

export async function updateRating (db, id, rating) {

  // get entry in database
  const current = await db.get("SELECT rating, total_rating FROM movies WHERE id = ?", id);
  
  var overallRating = parseFloat(current.rating);
  var newRating = parseFloat(rating);
  var totalRating = parseFloat(current.total_rating);
  

  console.log(overallRating);
  console.log(totalRating);
  console.log(newRating);

  // calculate new rating
  const newOverallRating = ((overallRating * totalRating) + newRating) / (totalRating + 1);
  
  const result = await db.run("UPDATE movies SET rating=?, total_rating=? WHERE id = ?", newOverallRating, (totalRating+1), id);
  return result.changes;
}