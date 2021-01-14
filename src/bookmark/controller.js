import * as model from './model.js';
import * as formController from './form-controller.js';

// GET FUNCTIONS

// Show all bookmarks
export async function index(ctx) {
    const data = await model.all(ctx.db);

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
        // JSON-Datenw erden ausgegeben
        const title = ctx.request.body.title;
        const uri = ctx.request.body.uri;
        if (title != null && uri != null) {
            const bookmark = {
                // neues Bookmark wird erzeugt
                id: undefined,
                title: title,
                uri: uri,
                description: ctx.request.body.description,
                tags: ctx.request.body.tags,
                date_created: ctx.request.body.date_created,
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
        //await formController.submitForm(ctx);
      }
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