import * as model from './model.js';
import * as formController from './form-controller.js';
import * as userModel from "./userModel.js";
import {
    Console
} from 'console';
import {
    parse
} from 'postcss';
import {
    data
} from 'autoprefixer';

// GET FUNCTIONS

// Show all movies
export async function index(ctx) {
    var data = await model.all(ctx.db);

    data = await sortByRating(data, false);
    data = await roundRatingInArray(data);

    await ctx.render('index', {
        movies: data,
    });
    if (data != undefined) {
        // Item was found in Database
        ctx.status = 200;
    } else {
        // Item was NOT found in database
        ctx.status = 404;
    }
}

// Show all favorites
export async function favorites(ctx) {
    
    var data = await model.all(ctx.db);
    const user = await userModel.getByUsername(ctx.db, ctx.session.user.username);

    // Sort movoies by rating (descending)
    data = await sortByRating(data, true);

    // Round ratings to 2 digits
    data = await roundRatingInArray(data);    

    // Filter for favorite movies
    data = await filterByIds(data, user.favorites);

    // add isFavorite attribute
    if(user.favorites != null) {
        for (var i = 0; i < (data.length); i++) {
            data[i].isFavorite = true;
        }
    }

    await ctx.render('favorites', {
        movies: data,
        user: user
    });

    if (data != undefined) {
        // Item was found in Database
        ctx.status = 200;
    } else {
        // Item was NOT found in database
        ctx.status = 404;
    }
}

// Filters an array of movies using a string containing a set of IDs and return those movies
// Used to filter for favorite movies
export async function filterByIds(array, string) {
    if(string != null) {
        var filtered = array.filter(containsId, string);
        return filtered;
    } else {
        console.error("There are no favorites. Return null");
        return null;
    }

}

// Checks if a movie has an id that is included in a given string
function containsId(value) {    
    const id = String(value.id);
    return this.includes(id);
}

// Show Account
export async function account(ctx) {
    // old version
    //const data = await ctx.session.user;

    // This works better because it updates in case data has changed within a session
    const data = await userModel.getByUsername(ctx.db, ctx.session.user.username);

    await ctx.render('account', {
        user: data
    });

}

// Show a movie by id
export async function show(ctx) {
    const data = await model.getById(ctx.db, ctx.params.id);

    data.rating = await roundRating(data.rating);

    if (data != undefined) {
        // Item was found in Database
        ctx.status = 200;

        if (ctx.accepts("text/html")) {
            await ctx.render('show', {
                movie: data
            });
        }

    } else {
        // Item was NOT found in database
        ctx.status = 404;
    }
}

export async function confirmDelete(ctx) {
    // delete a movie
    const data = await model.getById(ctx.db, ctx.params.id);

    if (ctx.accepts("text/html")) {
        await ctx.render('delete', {
            form: data
        });
    }
}

// POST FUNCTIONS

export async function add(ctx) {
    if (ctx.accepts("text/html")) {
        // Formular wird ueber den form-controller gerendert
        await formController.submitForm(ctx);
    } else if (ctx.accepts("application/json")) {
        // JSON-Daten werden ausgegeben
        const title = ctx.request.body.title;
        if (title != null) {
            const movie = {
                // neues movie wird erzeugt
                id: undefined,
                title: title,
                description: ctx.request.body.description,
                tags: ctx.request.body.tags,
                date_created: ctx.request.body.date_created,
                image: ctx.request.body.image,
                imdb: ctx.request.body.imdb,
                rottentomatoes: ctx.request.body.rottentomatoes
            };
            // neues movie in Datenbank sichern
            const newId = await model.add(ctx.db, movie);
            const newmovie = await model.getById(ctx.db, newId);
            ctx.body = JSON.stringify(newmovie, undefined, 2);
            ctx.status = 201;
            ctx.set("Content-Type", "application/json");
        } else {
            // fehlerhafte Daten eingegeben
            ctx.status = 400;
        }
    }
}

export async function edit(ctx) {
    if (ctx.accepts("text/html")) {
        // Hol die Daten fuer das movie und gib sie dem form-controller
        const data = await model.getById(ctx.db, ctx.params.id);
        if (data == null) {
            ctx.status = 404;
        } else {
            await formController.renderForm(ctx, data);
        }
    }
}

// Rate a movie
export async function rate(ctx) {
    const data = await model.getById(ctx.db, ctx.params.id);

    if (ctx.accepts("text/html")) {
        await ctx.render('rate', {
            form: data
        });
    }
}

// Show Imprint
export async function imprint(ctx) {
    if (ctx.accepts("text/html")) {
        await ctx.render('imprint', {
        });
    }
}

// Delete a movie by ID
export async function deleteById(ctx) {

    const data = await model.deleteById(ctx.db, ctx.params.id);
    console.log(data)

    if (data != undefined) {
        // 204 NO CONTENT
        ctx.status = 204;
    } else {
        // 404 NOT FOUND
        ctx.status = 404;
    }
}

export async function roundRating(rating) {

    var floatRating = parseFloat(rating)
    if (floatRating) {
        const result = +floatRating.toFixed(2);
        return result;
    } else {
        //console.error("There is no rating on this element");
        return floatRating;
    }
}

export async function roundRatingInArray(array) {
    for (var j = 0; j < (array.length); j++) {
        array[j].rating = await roundRating(array[j].rating);
    }
    return array
}

export function sortByRating(array, descending) {
    // sort by rating
    return array.sort(function (a, b) {
        var keyA = a.rating,
            keyB = b.rating;
        // Compare the 2 dates
        if (descending) {
            if (keyA > keyB) return -1;
            if (keyA < keyB) return 1;
        } else {
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
        }

        return 0;
    });
}

export async function favoriteMovie(ctx) {

    // Get current user
    const user = await userModel.getByUsername(ctx.db, ctx.session.user.username);

    console.log("BEFORE: " + user.favorites);

    // search favorites for the clicked movie id
    var favoritesArray = user.favorites.split(', ');

    // Log user's favorites
    //console.log("User's favorites: " + favoritesArray);

    for (var j = 0; j < (favoritesArray.length); j++) {
        //console.log(favoritesArray[j]);
    }


    //Log clicked movie's id
    //console.log("ID of clicked movie: " + ctx.params.id);

    

    const index = favoritesArray.indexOf(ctx.params.id)
    //console.log("Index" + index);
    
    if(index > -1 ) {
        console.log("Element found. Removing it");
        favoritesArray.splice(index, 1);
    } else {
        console.log("Element not found. It has to be added");
        favoritesArray.push(ctx.params.id);
    }

    var favoriteString = favoritesArray.join(", ");
    console.log("NEW: " + favoriteString);
    userModel.editFavorites(ctx.db, ctx.session.user.username, favoriteString);
}