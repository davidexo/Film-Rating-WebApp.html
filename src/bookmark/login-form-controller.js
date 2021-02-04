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
  if ((await userModel.passwordIsCorrect(user, form.password)) === true) {
    user.password = undefined;
    ctx.session.user = user;
    ctx.session.flash = `Du bist eingeloggt.`;
    ctx.redirect("/");
  } else {
    ctx.state.flash = `Diese Kombination aus Benutzername und Passwort ist nicht gültig`;
    await renderForm(ctx, form);
  }
}

export async function logout(ctx) {
  ctx.session.user = undefined;
  ctx.session.flash = `Du hast dich ausgeloggt.`;
  ctx.redirect("/");
}
