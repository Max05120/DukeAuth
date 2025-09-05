import crypto from 'crypto';

// Minimal RFC6238 TOTP helpers
export function generateTotpSecret(): string {
  return crypto.randomBytes(20).toString('base64');
}

export function verifyTotp(secretBase64: string, token: string, window = 1, step = 30): boolean {
  const time = Math.floor(Date.now() / 1000);
  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const counter = Math.floor(time / step) + errorWindow;
    const code = totpCode(secretBase64, counter);
    if (code === token) return true;
  }
  return false;
}

function totpCode(secretBase64: string, counter: number): string {
  const key = Buffer.from(secretBase64, 'base64');
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).toString().padStart(6, '0');
  return code;
}
