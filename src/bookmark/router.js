import Router from "@koa/router";
import * as controller from "./controller.js";
import * as formController from "./form-controller.js";
import * as login from "./login-form-controller.js";
import { isAuthenticated } from "./isAuthenticated.js";

const router = new Router();

router.get("/bookmark/login", login.showForm);

router.post("/bookmark/login", async (ctx, next) => {
  await login.submitForm(ctx);
});

router.get("/bookmark/logout", login.logout);

// Alle Bookmarks ausgeben
router.get("/", async (ctx, next) => {
    await controller.index(ctx);
  });
  
  // Ein neues Bookmark anlegen
  router.post("/bookmark/add", isAuthenticated, async (ctx, next) => {
    await controller.add(ctx);
  });

  router.post("/bookmark/add", isAuthenticated, async (ctx, next) => {
    await controller.add(ctx);
  });
  
  // Formular fuer ein neues Bookmark
  router.get("/bookmark/add", isAuthenticated, async (ctx, next) => {
    await formController.add(ctx);
  });
  
  // Ein bestimmtes Bookmark ausgeben
  router.get("/bookmark/:id", async (ctx, next) => {
    await controller.show(ctx);
  });
  
  // Ein Bookmark bearbeiten - Formular anzeigen
  router.get("/bookmark/:id/edit", isAuthenticated, async (ctx, next) => {
    await controller.edit(ctx);
  });
  
  // Ein Bookmark bearbeiten - Aktion ausfuehren

  router.post("/bookmark/:id/edit", isAuthenticated, async (ctx, next) => {
    await formController.submitForm(ctx);
  });
  
  // Frage: Bookmark loeschen?
  router.get("/bookmark/:id/delete", isAuthenticated, async (ctx, next) => {
    await controller.confirmDelete(ctx);
  });
  
  // Ein Bookmark loeschen
  router.post("/bookmark/:id/delete", isAuthenticated, async (ctx, next) => {
    await controller.deleteById(ctx);
    ctx.redirect("/");
  });
  
  // Ein Bookmark loeschen
  router.delete("/bookmark/:id", isAuthenticated, async (ctx, next) => {
    await controller.deleteById(ctx);
  });
  
  export default router;
  