import {
    debug
} from 'console';
import * as model from './model.js';
import * as uuid from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import * as comtroller from './controller.js';

// render form with additional data
export async function renderForm(ctx, form) {
    await ctx.render("add", {
        form: form
    });
}

// add a movie
export async function add(ctx) {
    //const data = await model.defaultData(ctx);
    await ctx.render("add");
}

// edit a movie
export async function edit(ctx) {
    const data = await model.getById(ctx.db, ctx.params.id);
    await ctx.render('edit', {
        form: data
    });
}
export async function submitForm(ctx) {
    var data = ctx.request.body || {};
    data.files = ctx.request.files;
    const errors = await validateForm(data);

    // Handle uploaded image
    if (data.files.image.size > 0) {
        const filename = generateFilename(data.files.image);
        data.image = filename;
        const localPath = path.join(process.cwd(), 'public', filename);

        fs.rename(data.files.image.path, localPath, function(err) {
            if ( err ) console.log('ERROR: ' + err);
        });
    } else {
        console.error("File is missing");
    }


    // Something went wrong
    if (Object.values(errors).some(Boolean)) {
        console.log("Fehler gefunden. Formular neu rendern");
        var data = {
            ...data,
            errors
        };
        await renderForm(ctx, data);
    } else {
        // Edit
        if (ctx.params.id) {
            console.table(data);
            await model.update(ctx.db, ctx.params.id, data);
            ctx.redirect("/movie/" + ctx.params.id);
        }
        // Add new
        else {
            await model.add(ctx.db, data);
            ctx.redirect("/");
        }
    }
}

export async function validateForm(data) {
    return {
        title: validateTitle(data.title),
        image: validateImage(data.image),
        //imdb: validateUri(data.imdb),
        //rottentomatoes: validateUri(data.rottentomatoes),
    }
}

// Check if a string contains more than 2 characters.
// containsText :: String -> Boolean
export function containsText(string) {
    return typeof string == 'string' && string.length >= 3;
}

// Generate error message if title is empty.
// validateTitle :: String -> String | undefined
export function validateTitle(title) {
    return !containsText(title) ? "Bitte einen Titel eingeben" : undefined;
}

// Generate error message if uri is not a valid URL
// validateUri :: String -> String | undefined
export function validateUri(string) {
    try {
        const myURL = new URL(string);
        return undefined;
    } catch (error) {
        return "Keine gültige URL";
    }
}

export function validateImage(file) {
    if (!file) return;
    if (file.size == 0) return;
    // Check file type (functions still missing)
    //if (mimetypeOk(file.type) && typeOk(file.name)) return;
    return 'Dateiformat nicht zulässig.';
}

// Randomly generate a filename using UUID
function generateFilename(file) {
    return path.join('upload', uuid.v4() +
        '.' + getFiletype(file.type))
}

function getFiletype(filename) {
    const string = filename;
    const lastSlash = string.lastIndexOf('/');

    const fileName = string.substring(0, lastSlash);
    const ext = string.substring(lastSlash + 1);
    return ext;
}

export async function rateMovie(ctx) {
    var data = ctx.request.body || {};

    console.log("Selected Rating: " + data.rating);
    
    if (ctx.params.id) {
        console.log("Post auf rate ausgeführt");
        await model.updateRating(ctx.db, ctx.params.id, data.rating);
        ctx.redirect("/movie/" + ctx.params.id);
    }
}