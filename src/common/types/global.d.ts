/* eslint-disable no-var */
/**
 * Declaraciones globales para toda la aplicación
 * Este archivo es reconocido automáticamente por TypeScript
 */
declare global {
  /**
   * Contexto de solicitud para mantener datos como el ID de solicitud
   * a través de diferentes servicios y módulos
   */
  var __requestContext: { requestId?: string } | undefined;
}

// Exportación vacía para que TypeScript trate esto como un módulo
export {};
