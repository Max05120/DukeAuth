import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { HttpError } from './errors';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(new HttpError(400, result.error.message));
    }
    // @ts-ignore - attach parsed body
    req.body = result.data;
    next();
  };
}
