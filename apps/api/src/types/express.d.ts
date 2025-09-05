import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    orgId?: string;
    userId?: string;
    jti?: string;
  }
}

export {};
