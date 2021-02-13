import argon2 from "argon2";
import readline from "readline";
const readlineQuestionAsync = (question) =>
  new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (password) => {
      rl.close();
      resolve(password);
    });
  });
(async function main() {
  if (process.argv[2]) {
    console.error("** Don’t enter a password on the shell prompt. **");
  } else {
    console.log(await argon2.hash(await readlineQuestionAsync("Password: ")));
  }
})();
