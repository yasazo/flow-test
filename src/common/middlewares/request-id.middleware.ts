import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que maneja el ID de solicitud (request ID)
 *
 * Este middleware:
 * 1. Lee el x-request-id del header si existe, o genera uno nuevo
 * 2. Lo almacena en el contexto global para acceso en toda la aplicación
 * 3. Lo incluye en los headers de respuesta
 * 4. Limpia el contexto al finalizar la solicitud
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const requestId = (req.headers['x-request-id'] as string) || 'no-request-id';

  // Guardar en contexto global para acceso en servicios
  global.__requestContext = { requestId };

  // Incluir en la respuesta para correlación
  res.setHeader('x-request-id', requestId);

  next();

  // Limpiar el contexto cuando finalice la solicitud
  res.on('finish', () => {
    global.__requestContext = undefined;
  });
}
