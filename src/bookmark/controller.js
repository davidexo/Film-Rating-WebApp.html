import * as model from './model.js';
import * as formController from './form-controller.js';
import {
    Console
} from 'console';

// GET FUNCTIONS

// Show all bookmarks
export async function index(ctx) {
    var data = await model.all(ctx.db);

    data = sortByRating(data, false);

    if (ctx.accepts() == "application/json") {
        ctx.body = data;
    } else {

        await ctx.render('index', {
            bookmarks: data
        });
    }
    if (data != undefined) {
        // Item was found in Database
        ctx.status = 200;
    } else {
        // Item was NOT found in database
        ctx.status = 404;
    }
}

// Show a bookmark by id
export async function show(ctx) {
    const data = await model.getById(ctx.db, ctx.params.id);

    data.rating = await roundRating(data.rating);

    if (data != undefined) {
        // Item was found in Database
        ctx.status = 200;

        if (ctx.accepts("text/html")) {
            await ctx.render('show', {
                bookmark: data
            });
        } else if (ctx.accepts("application/json")) {
            ctx.body = data;
        }

    } else {
        // Item was NOT found in database
        ctx.status = 404;
    }
}

export async function confirmDelete(ctx) {
    // delete a bookmark
    const data = await model.getById(ctx.db, ctx.params.id);

    if (ctx.accepts("text/html")) {
        console.log("Führe mit HTMl aus!");
        await ctx.render('delete', {
            form: data
        });
    } else if (ctx.accepts("application/json")) {
        console.log("Führe mit JSON aus");
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
            const bookmark = {
                // neues Bookmark wird erzeugt
                id: undefined,
                title: title,
                description: ctx.request.body.description,
                tags: ctx.request.body.tags,
                date_created: ctx.request.body.date_created,
                image: ctx.request.body.image,
                imdb: ctx.request.body.imdb,
                rottentomatoes: ctx.request.body.rottentomatoes
            };
            // neues Bookmark in Datenbank sichern
            const newId = await model.add(ctx.db, bookmark);
            const newBookmark = await model.getById(ctx.db, newId);
            ctx.body = JSON.stringify(newBookmark, undefined, 2);
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
        // Hol die Daten fuer das Bookmark und gib sie dem form-controller
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

// Delete a bookmark by ID
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
    if (rating) {
        const result = +rating.toFixed(2);
        return result;
    } else {
        console.error("There is no rating on this element");
        return rating;
    }
}

export function sortByRating(array, descending) {
    // sort by rating
    return array.sort(function (a, b) {
        var keyA = a.rating,
            keyB = b.rating;
        // Compare the 2 dates
        if(descending) {
            if (keyA > keyB) return -1;
            if (keyA < keyB) return 1;
        } else {
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
        }

        return 0;
    });
}