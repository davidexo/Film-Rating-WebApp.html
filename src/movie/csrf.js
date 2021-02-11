import { promisify } from "util";
import { randomBytes } from "crypto";

const randomBytesAsync = promisify(randomBytes);
export const generateToken = async () => {
  return Buffer.from(await randomBytesAsync(32)).toString("base64");
};
