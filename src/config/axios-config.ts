import axios from 'axios';
import { Logger } from 'nestjs-pino';

/**
 * Configura un interceptor global para Axios que automáticamente propagará
 * el x-request-id en todas las peticiones salientes.
 */
export function configureGlobalAxios(logger: Logger) {
  Object.defineProperty(axios.defaults.headers.common, 'x-request-id', {
    get: function () {
      return global.__requestContext?.requestId || 'no-request-id';
    },
    enumerable: true,
  });

  logger.log('Axios configurado para propagar automáticamente x-request-id');

  return axios;
}
