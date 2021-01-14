import * as model from './model.js';


// render form with additional data
export async function renderForm(ctx, form) {
    await ctx.render("add", {form: form});
}

// add a bookmark
export async function add(ctx) {
    //const data = await model.defaultData(ctx);
    await ctx.render("add");
}

// edit a bookmark
export async function edit(ctx) {
    const data = await model.getById(ctx.db, ctx.params.id);
    await ctx.render('edit', {
        form: data
    });
}

export async function submitForm(ctx) {
    var data = ctx.request.body || {};
    const errors = await validateForm(data);
    
    // Something went wrong
    if (Object.values(errors).some(Boolean)) {
        console.log("Fehler gefunden. Formular neu rendern");
        var data = {...data, errors};
        await renderForm(ctx, data);
    } else {
        // Edit
        console.log("Edit Entry");
        if(ctx.params.id) {
            await model.update(ctx.db, ctx.params.id, data);
            ctx.redirect("/bookmark/" + ctx.params.id);
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
        uri: validateUri(data.uri)
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