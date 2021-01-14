export default async function helloRouter(ctx, next) {
    if (ctx.url == '/hello') {

        const accepts = ctx.accepts('text/html');

        if (accepts == 'text/html') {
            console.log("Accepted!");
            await ctx.render('hello');
        }

        //ctx.body = 'Hello World!';
    } else {
        await next();
    }
}