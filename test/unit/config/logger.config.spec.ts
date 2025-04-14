import { getLoggerConfig } from '../../../src/config/logger.config';
import { Request, Response } from 'express';

describe('Logger Config', () => {
  // Guardar el NODE_ENV original
  const originalNodeEnv = process.env.NODE_ENV;
  const originalLogLevel = process.env.LOG_LEVEL;

  afterEach(() => {
    // Restaurar variables de entorno
    process.env.NODE_ENV = originalNodeEnv;
    process.env.LOG_LEVEL = originalLogLevel;

    // Limpiar el contexto global
    global.__requestContext = undefined;
  });

  it('should return a valid configuration object', () => {
    const config = getLoggerConfig();

    expect(config).toBeDefined();
    expect(config.pinoHttp).toBeDefined();
    expect(config.pinoHttp.messageKey).toBe('msg');
    expect(config.pinoHttp.timestamp).toBe(false);
  });

  it('should add transport configuration in development environment', () => {
    process.env.NODE_ENV = 'development';

    const config = getLoggerConfig();

    expect(config.pinoHttp.transport).toBeDefined();
    expect(config.pinoHttp.transport.target).toBe('pino-pretty');
    expect(config.pinoHttp.transport.options).toBeDefined();
    expect(config.pinoHttp.transport.options.singleLine).toBe(true);
    expect(config.pinoHttp.transport.options.colorize).toBe(true);
  });

  it('should use production formatters in production environment', () => {
    process.env.NODE_ENV = 'production';

    const config = getLoggerConfig();

    expect(config.pinoHttp.transport).toBeUndefined();
    expect(config.pinoHttp.formatters).toBeDefined();
    expect(config.pinoHttp.formatters.level).toBeDefined();
    expect(config.pinoHttp.formatters.bindings).toBeDefined();
  });

  it('should set log level from environment variable when provided', () => {
    // Establecer explícitamente un nivel de log
    process.env.LOG_LEVEL = 'debug';

    const config = getLoggerConfig();

    expect(config.pinoHttp.level).toBe('debug');
  });

  it('should have a level property for logging configuration', () => {
    // Simplemente verificar que el campo level existe
    const config = getLoggerConfig();

    expect(config.pinoHttp).toHaveProperty('level');
  });

  it('should include a customProps function that extracts request ID', () => {
    const config = getLoggerConfig();

    const customProps = config.pinoHttp.customProps;
    expect(typeof customProps).toBe('function');

    // Crear un mock de Request con x-request-id
    const req = {
      headers: {
        'x-request-id': 'test-request-id',
      },
      // Métodos mínimos requeridos
      get: jest.fn(),
      header: jest.fn(),
    } as unknown as Request;

    // Limpiar el contexto global
    global.__requestContext = undefined;

    const props = customProps(req);

    expect(props).toEqual({
      requestId: 'test-request-id',
    });
    expect(global.__requestContext).toEqual({ requestId: 'test-request-id' });
  });

  it('should generate custom success message', () => {
    const config = getLoggerConfig();

    const customSuccessMessage = config.pinoHttp.customSuccessMessage;
    expect(typeof customSuccessMessage).toBe('function');

    // Crear un mock de Request
    const req = {
      method: 'GET',
      url: '/api/test',
    } as unknown as Request;

    const message = customSuccessMessage(req);

    expect(message).toBe('GET /api/test');
  });

  it('should generate custom error message', () => {
    const config = getLoggerConfig();

    const customErrorMessage = config.pinoHttp.customErrorMessage;
    expect(typeof customErrorMessage).toBe('function');

    // Crear un mock de Request y Response
    const req = {
      method: 'POST',
      url: '/api/test',
    } as unknown as Request;

    const res = {
      statusCode: 500,
    } as unknown as Response;

    const message = customErrorMessage(req, res);

    expect(message).toBe('Error 500: POST /api/test');
  });

  it('should use default status code in error message if not provided', () => {
    const config = getLoggerConfig();

    const customErrorMessage = config.pinoHttp.customErrorMessage;

    // Crear un mock de Request y Response sin statusCode
    const req = {
      method: 'PUT',
      url: '/api/test',
    } as unknown as Request;

    const res = {} as unknown as Response;

    const message = customErrorMessage(req, res);

    expect(message).toBe('Error 500: PUT /api/test');
  });

  it('should serialize error objects', () => {
    // Simplemente verificar que la función existe y devuelve un objeto
    const config = getLoggerConfig();
    const serializers = config.pinoHttp.serializers;

    const error = new Error('Test error');
    const serialized = serializers.err(error);

    expect(serialized).toEqual(expect.any(Object));
  });

  it('should handle different error types', () => {
    const config = getLoggerConfig();
    const serializers = config.pinoHttp.serializers;

    // Verificar serialización con diferentes tipos de errores

    // Error normal
    const normalError = new Error('Normal error');
    const serializedNormal = serializers.err(normalError);
    expect(serializedNormal).toEqual(expect.any(Object));

    // Error tipo Axios
    const axiosError = {
      isAxiosError: true,
      message: 'Network Error',
      config: { method: 'get', url: 'http://example.com' },
      response: { status: 404 },
    };
    const serializedAxios = serializers.err(axiosError);
    expect(serializedAxios).toEqual(expect.any(Object));

    // Error con detalles
    const errorWithDetails = new Error('Error with details');
    (errorWithDetails as any).details = { code: 'CUSTOM_ERROR' };
    const serializedWithDetails = serializers.err(errorWithDetails);
    expect(serializedWithDetails).toEqual(expect.any(Object));
  });

  it('should use genReqId function to extract or generate request ID', () => {
    const config = getLoggerConfig();

    const genReqId = config.pinoHttp.genReqId;
    expect(typeof genReqId).toBe('function');

    // Probar con x-request-id en headers
    const reqWithId = {
      headers: {
        'x-request-id': 'existing-id',
      },
    } as unknown as Request;

    expect(genReqId(reqWithId)).toBe('existing-id');

    // Probar sin x-request-id
    const reqWithoutId = {
      headers: {},
    } as unknown as Request;

    expect(genReqId(reqWithoutId)).toBe('no-request-id');
  });
});
