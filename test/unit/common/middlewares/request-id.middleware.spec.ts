import { requestIdMiddleware } from '../../../../src/common/middlewares/request-id.middleware';
import { Request, Response, NextFunction } from 'express';

describe('requestIdMiddleware', () => {
  beforeEach(() => {
    // Limpiar el contexto global antes de cada prueba
    global.__requestContext = undefined;
  });

  afterEach(() => {
    // Limpiar mocks y global
    jest.clearAllMocks();
    global.__requestContext = undefined;
  });

  it('should use existing request id from header if present', () => {
    // Mock de Request con métodos necesarios
    const req = {
      headers: {
        'x-request-id': 'existing-request-id',
      },
      // Agregar métodos mínimos requeridos por Express.Request
      get: jest.fn(),
      header: jest.fn(),
    } as unknown as Request;

    // Mock de Response con métodos necesarios
    const res = {
      setHeader: jest.fn(),
      on: jest.fn(),
      // Agregar métodos mínimos requeridos por Express.Response
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    requestIdMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'x-request-id',
      'existing-request-id',
    );
    expect(global.__requestContext).toEqual({
      requestId: 'existing-request-id',
    });
    expect(next).toHaveBeenCalled();
  });

  it('should use default request id if not present in headers', () => {
    // Mock de Request sin x-request-id
    const req = {
      headers: {},
      // Agregar métodos mínimos requeridos por Express.Request
      get: jest.fn(),
      header: jest.fn(),
    } as unknown as Request;

    // Mock de Response
    const res = {
      setHeader: jest.fn(),
      on: jest.fn(),
      // Métodos mínimos requeridos
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    requestIdMiddleware(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'no-request-id');
    expect(global.__requestContext).toEqual({
      requestId: 'no-request-id',
    });
    expect(next).toHaveBeenCalled();
  });

  it('should call cleanup function when response ends', () => {
    // Mock de Request
    const req = {
      headers: {},
      // Agregar métodos mínimos requeridos por Express.Request
      get: jest.fn(),
      header: jest.fn(),
    } as unknown as Request;

    // Mock de Response con simulación de 'finish'
    const res = {
      setHeader: jest.fn(),
      on: jest.fn().mockImplementation((event, callback) => {
        if (event === 'finish') {
          callback();
        }
        return res;
      }),
      // Métodos mínimos requeridos
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    requestIdMiddleware(req, res, next);

    // Verificar que se llame a res.on con 'finish'
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));

    // Verificar que se haya limpiado el contexto
    expect(global.__requestContext).toBeUndefined();
  });
});
