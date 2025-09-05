import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { prisma } from '@dukeauth/db';
import type { Env } from '@dukeauth/core';

// Password hashing with optional pepper
export async function hashPassword(password: string, env: Env): Promise<string> {
  const pepper = env.BCRYPT_PEPPER || '';
  const saltRounds = 12;
  return bcrypt.hash(password + pepper, saltRounds);
}

export async function verifyPassword(password: string, hash: string, env: Env): Promise<boolean> {
  const pepper = env.BCRYPT_PEPPER || '';
  return bcrypt.compare(password + pepper, hash);
}

// JWT helpers with jti stored in DB via Session model
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  jti: string;
}

export async function issueTokens(userId: string, env: Env): Promise<TokenPair> {
  const jti = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  const accessToken = jwt.sign({ sub: userId, jti, iat: now }, env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: userId, jti, iat: now }, env.JWT_REFRESH_SECRET, { expiresIn: '30d' });

  const refreshHash = sha256(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId, jti, refreshTokenHash: refreshHash, expiresAt }
  });

  return { accessToken, refreshToken, jti };
}

export function verifyAccessToken(token: string, env: Env): { userId: string; jti: string } | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; jti: string };
    return { userId: decoded.sub, jti: decoded.jti };
  } catch {
    return null;
  }
}

export async function rotateRefreshToken(oldRefreshToken: string, env: Env): Promise<TokenPair | null> {
  try {
    const decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET) as { sub: string; jti: string };
    const existing = await prisma.session.findUnique({ where: { jti: decoded.jti } });
    if (!existing || existing.revokedAt) return null;
    const oldHash = sha256(oldRefreshToken);
    if (existing.refreshTokenHash !== oldHash) return null;

    // Revoke old session
    await prisma.session.update({ where: { jti: decoded.jti }, data: { revokedAt: new Date() } });
    return issueTokens(decoded.sub, env);
  } catch {
    return null;
  }
}

export async function revokeSession(jti: string): Promise<void> {
  await prisma.session.updateMany({ where: { jti }, data: { revokedAt: new Date() } });
}

// TOTP helpers
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function verifyTotp(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

// API key helpers: generate, hash, and verify
export function generateApiKey(): { key: string; hash: string } {
  const raw = `da_${crypto.randomBytes(32).toString('hex')}`;
  return { key: raw, hash: sha256(raw) };
}

export function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

