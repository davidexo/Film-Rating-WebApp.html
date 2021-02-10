import Router from "@koa/router";
import koaBody from "koa-body";
import * as controller from "./controller.js";
import * as formController from "./form-controller.js";
import * as login from "./login-form-controller.js";
import {
  isAuthenticated
} from "./isAuthenticated.js";

const router = new Router();

router.get("/movie/login", login.showForm);

router.post("/movie/login", async (ctx, next) => {
  await login.submitForm(ctx);
});

router.get("/movie/logout", login.logout);

// Alle movies ausgeben
router.get("/", async (ctx, next) => {
  await controller.index(ctx);
});

// Alle favoriten ausgeben
router.get("/favorites", isAuthenticated, async (ctx, next) => {
  await controller.favorites(ctx);
});

// Alle favoriten ausgeben
router.get("/account", isAuthenticated, async (ctx, next) => {
  await controller.account(ctx);
});

// Einen neues movie anlegen
router.post("/movie/add", isAuthenticated, async (ctx, next) => {
  await controller.add(ctx);
});

router.post("/movie/add", isAuthenticated, async (ctx, next) => {
  await controller.add(ctx);
});

// Formular fuer ein neues movie
router.get("/movie/add", isAuthenticated, async (ctx, next) => {
  await formController.add(ctx);
});

// Ein bestimmtes movie ausgeben
router.get("/movie/:id", async (ctx, next) => {
  await controller.show(ctx);
});

// Ein movie bearbeiten - Formular anzeigen
router.get("/movie/:id/edit", isAuthenticated, async (ctx, next) => {
  await controller.edit(ctx);
});

// Ein movie bearbeiten - Aktion ausfuehren
router.post("/movie/:id/edit", isAuthenticated, async (ctx, next) => {
  await formController.submitForm(ctx);
});


// Frage: movie loeschen?
router.get("/movie/:id/delete", isAuthenticated, async (ctx, next) => {
  await controller.confirmDelete(ctx);
});

// Ein movie loeschen
router.post("/movie/:id/delete", isAuthenticated, async (ctx, next) => {
  await controller.deleteById(ctx);
  ctx.redirect("/");
});

// Ein movie loeschen
router.delete("/movie/:id", async (ctx, next) => {
  await controller.deleteById(ctx);
});

// Einen Film bewerten - Formular anzeigen
router.get("/movie/:id/rate", async (ctx, next) => {
  await controller.rate(ctx);
});

// Einen Film bewerten - Aktion ausfuehren
router.post("/movie/:id/rate", async (ctx, next) => {
  await formController.rateMovie(ctx);
});

// Zum Impressum
router.get("/impressum", async (ctx, next) => {
  await controller.imprint(ctx);
});

export default router;