import bcrypt from "bcrypt";

export async function hashPassword(password: string) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}
