export const isAuthenticated = async (ctx, next) => {
  if (!ctx.state.user) {
    ctx.throw(401);
  }
  await next();
};
