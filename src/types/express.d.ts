import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    context?: {
      requestId: string;
      startedAt: number;
      servicio: string;
    };
  }
}

