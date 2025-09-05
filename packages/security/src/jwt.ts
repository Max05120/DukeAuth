import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@dukeauth/db';

const ACCESS_EXP = '15m';
const REFRESH_EXP_SECONDS = 60 * 60 * 24 * 30; // 30 days

function accessSecret() {
  const v = process.env.JWT_SECRET;
  if (!v) throw new Error('Missing JWT_SECRET');
  return v;
}
function refreshSecret() {
  return process.env.JWT_REFRESH_SECRET || accessSecret();
}

export type JwtPayload = { sub: string; jti: string; role?: string };

export async function issueTokens(userId: string) {
  const jti = crypto.randomUUID();
  const refreshToken = jwt.sign({ sub: userId, jti }, refreshSecret(), { expiresIn: REFRESH_EXP_SECONDS });
  const accessToken = jwt.sign({ sub: userId, jti }, accessSecret(), { expiresIn: ACCESS_EXP });
  const refreshHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_EXP_SECONDS * 1000);
  await prisma.session.create({ data: { userId, jti, refreshTokenHash: refreshHash, expiresAt } });
  return { accessToken, refreshToken, jti };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, accessSecret()) as any;
}

export async function rotateRefreshToken(oldToken: string) {
  const decoded = jwt.verify(oldToken, refreshSecret()) as JwtPayload & { exp: number };
  const oldHash = sha256(oldToken);
  const session = await prisma.session.findUnique({ where: { jti: decoded.jti } });
  if (!session || session.refreshTokenHash !== oldHash || session.revokedAt) {
    throw new Error('Invalid session');
  }
  // Revoke old
  await prisma.session.update({ where: { jti: decoded.jti }, data: { revokedAt: new Date() } });
  // Issue new
  return issueTokens(decoded.sub);
}

export async function revokeSession(jti: string) {
  await prisma.session.updateMany({ where: { jti }, data: { revokedAt: new Date() } });
}

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
