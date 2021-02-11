export async function getByUsername(db, username) {
  return await db.get("SELECT * FROM users WHERE username= ?", username);
}

export async function passwordIsCorrect(user, password) {
  if (user && password) {
    return user.password === password;
  } else {
    return false;
  }
}
