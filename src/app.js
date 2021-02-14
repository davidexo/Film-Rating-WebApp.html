import Koa from "koa";
import http from "http";
import movieRouter from "./movie/router.js";
import koaBody from "koa-body";
import views from "koa-views";
import koaStatic from "koa-static";
import { flash } from "./middleware/flash.js";
import session from "koa-session";

// SHIT GOES WRONG RIGHT HERE
import SQLite3Store from "koa-sqlite3-session";

export default async function webApp(config) {
  // Initialize application
  const app = new Koa();

  // Hand database over to controllers
  app.context.db = config.db;

  // Insert Middelware here!
  app.use(
    koaBody({
      multipart: true,
      formidable: {
        // 1mb
        maxFileSize: 1024 * 1024,
      },
      onError: (error, ctx) => {
        if (error.message.indexOf("maxFileSize exceeded") === 0) {
          ctx.throw(413); // Payload too large
        }
        throw error;
      },
    })
  );

  app.use(async (ctx, next) => {
    //console.log(ctx.status);
    if (ctx.status === 401) {
      console.log("Du bist nicht autorisiert (Middleware");
    }
    await next();
  });

  app.use(koaStatic("./public"));

  app.keys = ["3)!G[F-.85LCAUY_WSS6!(y:)G02R"];

  app.use(session({ store: new SQLite3Store("./data/session.sqlite") }, app));
  app.use(flash);

  app.use(async (ctx, next) => {
    if (ctx.session.user) {
      ctx.state.user = ctx.session.user;
      ctx.state.authenticated = true;
    }
    await next();
  });

  const templateDir = process.cwd() + "/views";

  const render = views(templateDir, {
    extension: "html",
    map: {
      html: "nunjucks",
    },
    options: {
      nunjucks: {
        loader: templateDir,
      },
    },
  });

  // Extent context protype with the render function
  app.use(render);

  // Use controller functions
  app.use(movieRouter.routes());

  return http.createServer(app.callback()).listen(config.port, () => {
    console.log(`Listening on port ${config.port}`);
  });
}
