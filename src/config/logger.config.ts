import { Request, Response } from 'express';

/**
 * Configuración del logger Pino para la aplicación
 * Optimizado para desarrollo y producción
 */
export const getLoggerConfig = () => {
  return {
    pinoHttp: {
      ...(process.env.NODE_ENV !== 'production' && {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            messageFormat: '{requestId} {context} {msg}',
            ignore: 'pid,hostname,time',
          },
        },
      }),
      ...(process.env.NODE_ENV === 'production' && {
        formatters: {
          level: (label) => ({ level: label }),
          bindings: (bindings) => {
            return { context: bindings.context || 'App' };
          },
        },
      }),
      formatters: {
        level: (label) => ({ level: label }),
        bindings: () => ({}),
      },
      customProps: (req: Request) => {
        const requestId =
          (req.headers['x-request-id'] as string) || 'no-request-id';
        if (!global.__requestContext) {
          global.__requestContext = { requestId };
        }
        return {
          requestId,
        };
      },
      messageKey: 'msg',
      timestamp: false,
      customSuccessMessage: function (req: Request) {
        return `${req.method} ${req.url}`;
      },
      customErrorMessage: function (req: Request, res: Response) {
        return `Error ${res.statusCode || 500}: ${req.method} ${req.url}`;
      },
      autoLogging: process.env.NODE_ENV !== 'production',
      serializers: {
        req: () => undefined,
        res: () => undefined,
        err: (err) => {
          const isAxiosError = err.isAxiosError === true;
          let errorBase = {};
          if (isAxiosError) {
            errorBase = {
              msg: err.message,
              type: 'AxiosError',
              code: err.code,
              method: err.config?.method?.toUpperCase() || 'UNKNOWN',
              url: err.config?.url,
              status: err.response?.status,
              statusText: err.response?.statusText,
            };
          } else {
            const originalError =
              err.response?.message || err.response?.error || err;
            errorBase = {
              msg: originalError?.message || err.message || 'Unknown error',
              type: originalError?.name || err.name || 'Error',
              code: originalError?.code || err.code || err.status || 'ERROR',
            };
          }
          if (process.env.NODE_ENV !== 'production') {
            return {
              ...errorBase,
              stack: err.stack,
              ...(err.details && { details: err.details }),
              ...(err.response && { response: err.response }),
              ...(err.status && { status: err.status }),
            };
          }
          return {
            ...errorBase,
            location:
              err.stack
                ?.split('\n')
                .find((line) => line.includes('.ts:') || line.includes('.js:'))
                ?.trim() || 'unknown',
            ...(err.details && { details: err.details }),
            ...(err.status && { status: err.status }),
          };
        },
      },
      genReqId: (req: Request) => {
        return req.headers['x-request-id'] || 'no-request-id';
      },
      level:
        process.env.LOG_LEVEL ||
        (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      wrapSerializers: true,
    },
  };
};
