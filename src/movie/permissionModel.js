export async function getByUserId(db, id) {
  const permissions = await db.get(
    "SELECT permissions FROM roles JOIN users ON users.role = roles.role WHERE users.id = ?",
    id
  );
  var splittedArray = await permissions.permissions.split(", ");
  return splittedArray;
}
