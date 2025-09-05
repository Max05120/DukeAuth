import bcrypt from 'bcryptjs';

const ROUNDS = 12;

function pepper(): string {
  const p = process.env.PASSWORD_PEPPER;
  if (!p) throw new Error('Missing PASSWORD_PEPPER');
  return p;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(ROUNDS);
  return bcrypt.hash(password + pepper(), salt);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password + pepper(), passwordHash);
}
