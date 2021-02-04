export const flash = async (ctx, next) => {
  if (ctx.session.flash) {
    ctx.state.flash = ctx.session.flash;
    ctx.session.flash = undefined;
  }
  await next();
};
