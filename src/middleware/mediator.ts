import { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import eventBus from '@/utils/eventBus';

interface RequestContext {
  requestId: string;
  startedAt: number;
  servicio: string;
}

/**
 * Middleware de mediación.
 * - Genera un identificador de solicitud.
 * - Clasifica la petición por servicio (ruta base).
 * - Emite eventos al EventBus para seguimiento asincrónico.
 */
export const mediatorMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const context: RequestContext = {
    requestId: req.headers['x-request-id']?.toString() || uuid(),
    startedAt: Date.now(),
    servicio: req.baseUrl.replace('/api/', '').split('/')[0] || 'root'
  };

  (req as any).context = context;

  eventBus.emit('mediator:request-started', {
    requestId: context.requestId,
    servicio: context.servicio,
    metodo: req.method,
    ruta: req.originalUrl
  });

  res.on('finish', () => {
    eventBus.emit('mediator:request-finished', {
      requestId: context.requestId,
      servicio: context.servicio,
      metodo: req.method,
      ruta: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Date.now() - context.startedAt
    });
  });

  next();
};

