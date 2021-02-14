export function hasPermission(permission) {
  return async function (ctx, next) {
    if (!check(ctx.state.user, permission)) {
      ctx.throw(401);
    }
    await next();
  };
}

export async function check(user, singlePermission) {
  if (user) {
    return await user.permissions.includes(singlePermission);
  }
}
