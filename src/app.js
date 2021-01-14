import Koa from 'koa';
import http from 'http';
import helloRouter from './hello.js';
import bookmarkRouter from './bookmark/router.js';
import koaBody from 'koa-body';
import views from 'koa-views';
import serve from "koa-static";
import { SSL_OP_CRYPTOPRO_TLSEXT_BUG } from 'constants';


export default async function webApp(config) {


	const templateDir = process.cwd() + '/views';
	const render = views(templateDir, {
		extension: 'html',
		map: { html: 'nunjucks' },
		options: {
			nunjucks: { loader: templateDir }
		}
	});

	// Initialize application
	const app = new Koa();

	// Hand database over to controllers
	app.context.db = config.db;

	// Insert Middelware here!
	app.use(koaBody());

	// Extent context protype with the render function
	app.use(render);

	// Hello World!
	app.use(helloRouter);

	// Use controller functions
	app.use(bookmarkRouter.routes());

	return http.createServer(app.callback()).listen(config.port, () => {
		console.log(`Listening on port ${config.port}`);
	});

}