import Router from "@koa/router";
import koaBody from "koa-body";
import * as controller from "./controller.js";
import * as formController from "./form-controller.js";
import * as login from "./login-form-controller.js";
import hasPermission from "../middleware/hasPermission.js";

const router = new Router();

router.get("/movie/login", login.showForm);

router.post("/movie/login", async (ctx, next) => {
  await login.submitForm(ctx);
});

router.get("/movie/logout", hasPermission("can logout"), login.logout);

// Alle movies ausgeben
router.get("/", async (ctx, next) => {
  await controller.index(ctx);
});

// Alle favoriten ausgeben
router.get(
  "/favorites",
  hasPermission("view favourites"),
  async (ctx, next) => {
    await controller.favorites(ctx);
  }
);

// Alle favoriten ausgeben
router.get("/account", hasPermission("view account"), async (ctx, next) => {
  await controller.account(ctx);
});

// Einen neues movie anlegen
router.post("/movie/add", hasPermission("add movie"), async (ctx, next) => {
  await controller.add(ctx);
});

router.post("/movie/add", hasPermission("add movie"), async (ctx, next) => {
  await controller.add(ctx);
});

// Formular fuer ein neues movie
router.get("/movie/add", hasPermission("add movie"), async (ctx, next) => {
  await formController.add(ctx);
});

// Post: Den Account bearbeiten
router.post("/account", hasPermission("edit account"), async (ctx, next) => {
  await formController.editAccount(ctx);
});

// Ein bestimmtes movie ausgeben
router.get("/movie/:id", async (ctx, next) => {
  await controller.show(ctx);
});

// Ein movie bearbeiten - Formular anzeigen
router.get(
  "/movie/:id/edit",
  
  hasPermission("edit movie"),
  async (ctx, next) => {
    await controller.edit(ctx);
  }
);

// Ein movie bearbeiten - Aktion ausfuehren
router.post(
  "/movie/:id/edit",
  
  hasPermission("edit movie"),
  async (ctx, next) => {
    await formController.submitForm(ctx);
  }
);

// Frage: movie loeschen?
router.get(
  "/movie/:id/delete",
  hasPermission("delete movie"),
  async (ctx, next) => {
    await controller.confirmDelete(ctx);
  }
);

// Ein movie loeschen
router.post(
  "/movie/:id/delete",
  hasPermission("delete movie"),
  async (ctx, next) => {
    await controller.deleteById(ctx);
    ctx.redirect("/");
  }
);

// Ein movie loeschen
router.delete(
  "/movie/:id",
  hasPermission("delete movie"),
  async (ctx, next) => {
    await controller.deleteById(ctx);
  }
);

// Einen Film bewerten - Formular anzeigen
router.get(
  "/movie/:id/rate",
  hasPermission("rate movie"),
  async (ctx, next) => {
    await controller.rate(ctx);
  }
);

// Einen Film bewerten - Aktion ausfuehren
router.post(
  "/movie/:id/rate",
  hasPermission("rate movie"),
  async (ctx, next) => {
    await formController.rateMovie(ctx);
  }
);

// Zum Impressum
router.get("/impressum", async (ctx, next) => {
  await controller.imprint(ctx);
});

export default router;
