import crypto from 'crypto';

export function generateApiKey(prefix = 'duk'): { key: string; prefix: string; hash: string } {
  const id = crypto.randomBytes(24).toString('hex');
  const key = `${prefix}_${id}`;
  return { key, prefix, hash: sha256(key) };
}

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
