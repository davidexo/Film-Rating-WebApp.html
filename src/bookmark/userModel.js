export async function getByUsername(db, username) {
  return await db.get("SELECT * FROM users WHERE username= ?", username);
}

/*export const isPasswordCorrect = await bcrypt.compare(
  ctx.request.body.password,
  user.password
);*/
