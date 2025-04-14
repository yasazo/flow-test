import { Logger } from 'nestjs-pino';
import axios from 'axios';

// Crear un mock para Object.defineProperty
const originalDefineProperty = Object.defineProperty;
let capturedPropertyDescriptor: PropertyDescriptor | null = null;

// Mockear Object.defineProperty para evitar el error y capturar el descriptor
jest
  .spyOn(Object, 'defineProperty')
  .mockImplementation((obj, prop, descriptor) => {
    if (prop === 'x-request-id') {
      capturedPropertyDescriptor = descriptor;
      return obj; // Devolver el objeto sin modificar
    }
    // Para cualquier otra propiedad, usar la implementación original
    return originalDefineProperty(obj, prop, descriptor);
  });

// Ahora importamos el módulo bajo prueba
import { configureGlobalAxios } from '../../../src/config/axios-config';

describe('Axios Config', () => {
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedPropertyDescriptor = null;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    // Limpiar el contexto global
    global.__requestContext = undefined;
  });

  afterAll(() => {
    // Restaurar el método original
    jest.restoreAllMocks();
  });

  it('should log configuration message when configuring axios', () => {
    configureGlobalAxios(mockLogger as unknown as Logger);

    expect(mockLogger.log).toHaveBeenCalledWith(
      'Axios configurado para propagar automáticamente x-request-id',
    );
  });

  it('should return axios instance', () => {
    const result = configureGlobalAxios(mockLogger as unknown as Logger);

    expect(result).toBe(axios);
  });

  it('should define x-request-id property with a getter function', () => {
    configureGlobalAxios(mockLogger as unknown as Logger);

    // Verificar que se llamó a Object.defineProperty con los parámetros correctos
    expect(Object.defineProperty).toHaveBeenCalledWith(
      expect.anything(),
      'x-request-id',
      expect.any(Object),
    );

    // Verificar que el descriptor capturado tiene un getter
    expect(capturedPropertyDescriptor).toBeDefined();
    expect(typeof capturedPropertyDescriptor!.get).toBe('function');

    // Verificar que el getter es enumerable
    expect(capturedPropertyDescriptor!.enumerable).toBe(true);
  });

  it('should get request ID from global context when available', () => {
    configureGlobalAxios(mockLogger as unknown as Logger);

    // Simular que hay un ID de solicitud en el contexto global
    global.__requestContext = { requestId: 'test-request-id' };

    // Llamar al getter capturado
    const getter = capturedPropertyDescriptor!.get;
    const requestId = getter!.call({});

    expect(requestId).toBe('test-request-id');
  });

  it('should return default request ID when global context is not available', () => {
    configureGlobalAxios(mockLogger as unknown as Logger);

    // Asegurarse de que no hay contexto global
    global.__requestContext = undefined;

    // Llamar al getter capturado
    const getter = capturedPropertyDescriptor!.get;
    const requestId = getter!.call({});

    expect(requestId).toBe('no-request-id');
  });
});
