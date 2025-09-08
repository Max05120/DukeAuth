import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const mapped = mapPrismaError(err);
  const status = (mapped?.status ?? err.status) || 500;
  const message = (mapped?.message ?? err.message) || 'Internal Server Error';
  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json({ error: message });
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function mapPrismaError(err: any): { status: number; message: string } | null {
  // Known request errors
  if (err && typeof err === 'object' && err.code && typeof err.code === 'string') {
    switch (err.code) {
      case 'P2002':
        return { status: 409, message: 'Unique constraint failed' };
      case 'P2025':
        return { status: 404, message: 'Record not found' };
      default:
        return null;
    }
  }
  return null;
}
