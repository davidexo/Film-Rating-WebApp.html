import * as userModel from "./userModel.js";

export async function showForm(ctx) {
  const data = await defaultData(ctx);
  await renderForm(ctx, data);
}

export async function defaultData(ctx) {
  return {
    username: undefined,
    password: undefined,
  };
}

async function renderForm(ctx, data) {
  await ctx.render("login", {
    form: data,
  });
}

export async function submitForm(ctx) {
  const form = ctx.request.body || {};
  const user = await userModel.getByUsername(ctx.db, form.username);
  if (form.password == user.password) {
    ctx.session.flash = `Du bist eingeloggt.`;
    user.password = undefined;
    ctx.session.user = user;

    ctx.redirect("/");
  }
}

export async function logout(ctx) {
  ctx.session.flash = `Du hast dich ausgeloggt.`;
  ctx.session.user = undefined;
  ctx.redirect("/");
}
