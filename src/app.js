import Koa from 'koa';
import http from 'http';
import bookmarkRouter from './bookmark/router.js';
import koaBody from 'koa-body';
import views from 'koa-views';
import koaStatic from "koa-static";



export default async function webApp(config) {

	// Initialize application
	const app = new Koa();

	// Hand database over to controllers
	app.context.db = config.db;

	// Insert Middelware here!
	//app.use(koaBody());
	app.use(koaBody({
		multipart: true,
		formidable: {
			// 1mb
			maxFileSize: 1024 * 1024
		},
		onError: (error, ctx) => {
			if (error.message.indexOf('maxFileSize exceeded') === 0) {
			ctx.throw(413); // Payload too large
			}
			throw error;
			}
	}));
	app.use(koaStatic('./public'));

	const templateDir = process.cwd() + '/views';

	const render = views(templateDir, {
		extension: 'html',
		map: {
			html: 'nunjucks'
		},
		options: {
			nunjucks: {
				loader: templateDir
			}
		}
	});


	// Extent context protype with the render function
	app.use(render);

	// Use controller functions
	app.use(bookmarkRouter.routes());

	return http.createServer(app.callback()).listen(config.port, () => {
		console.log(`Listening on port ${config.port}`);
	});

}