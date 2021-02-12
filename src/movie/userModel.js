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

export async function editUser(db, username, data) {
  const result = await db.run("UPDATE users SET first_Name=?, last_Name=?, favorites=? WHERE username = ?", 
  data.first_name, data.last_name, data.favorites, username);
  return result.changes;
}