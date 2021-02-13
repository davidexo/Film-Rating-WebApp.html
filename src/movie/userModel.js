import * as argon from "argon2";

export async function getByUsername(db, username) {
  if (username)
  {
    return await db.get("SELECT * FROM users WHERE username= ?", username);
  }
  
}

export async function passwordIsCorrect(user, password) {
  if (password)
  {
    const hashedPassword = user.password;
    const correctPassword = await validatePassword(hashedPassword, password);
    return correctPassword;
  }
}

export async function editUser(db, username, data) {
  const result = await db.run("UPDATE users SET first_Name=?, last_Name=?, favorites=? WHERE username = ?", 
  data.first_name, data.last_name, data.favorites, username);
  return result.changes;
}


async function validatePassword(hashedPassword, plainPassword) {
  return await argon.verify(hashedPassword, plainPassword);
}

async function hashPassword(password) {
  return await argon.hash(password);
}
