import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';

// Desactivar los logs reales durante las pruebas
jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

// Mock de axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock de AppService
const mockAppService = {
  getHello: jest.fn().mockReturnValue('Hello World!'),
  methodThatWillFail: jest.fn().mockImplementation(() => {
    throw new Error('Service failure test');
  }),
};

// Mock para process.env
const originalProcessEnv = process.env;

describe('AppController', () => {
  let appController: AppController;

  beforeAll(() => {
    // Mock de process.env para test de health check
    process.env = {
      ...originalProcessEnv,
      npm_package_version: '1.0.0',
      NODE_ENV: 'test',
    };
  });

  afterAll(() => {
    process.env = originalProcessEnv;
  });

  // Test suite para cuando el servicio externo NO está configurado
  describe('with external service NOT configured', () => {
    beforeEach(async () => {
      // Mock de ConfigService sin URL externa
      const mockConfigService = {
        get: jest.fn().mockImplementation((key, defaultValue) => {
          if (key === 'EXTERNAL_SERVICE_URL') {
            return ''; // URL vacía
          }
          return defaultValue;
        }),
      };

      const app: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          { provide: AppService, useValue: mockAppService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      appController = app.get<AppController>(AppController);

      jest.clearAllMocks();
    });

    // Tests básicos
    describe('getHello', () => {
      it('should return "Hello World!"', () => {
        expect(appController.getHello()).toBe('Hello World!');
        expect(mockAppService.getHello).toHaveBeenCalled();
      });
    });

    describe('error endpoints', () => {
      it('should throw BadRequestException from testNestError', () => {
        expect(() => appController.testNestError()).toThrow(
          BadRequestException,
        );
      });

      it('should throw TypeError from testRuntimeError', () => {
        expect(() => appController.testRuntimeError()).toThrow(TypeError);
      });

      it('should throw InternalServerErrorException from testServiceError', () => {
        expect(() => appController.testServiceError()).toThrow(
          InternalServerErrorException,
        );
        expect(mockAppService.methodThatWillFail).toHaveBeenCalled();
      });

      it('should throw NotFoundException from testNotFoundException', () => {
        expect(() => appController.testNotFoundException()).toThrow(
          NotFoundException,
        );
      });
    });

    describe('getHeaders', () => {
      it('should return headers object', () => {
        const mockHeaders = {
          host: 'localhost:3000',
          'user-agent': 'test-agent',
          'x-request-id': '12345',
        };

        // Agregar un objeto vacío como segundo parámetro para query
        const mockQuery = {};

        const result = appController.getHeaders(mockHeaders, mockQuery);

        expect(result).toEqual({
          message: 'Headers recibidos',
          headers: mockHeaders,
          query: mockQuery,
          randomNumber: undefined, // No hay random en la query
        });
      });

      it('should return headers and random number when query has random parameter', () => {
        const mockHeaders = {
          host: 'localhost:3000',
          'user-agent': 'test-agent',
        };

        const mockQuery = {
          random: '42',
        };

        const result = appController.getHeaders(mockHeaders, mockQuery);

        expect(result).toEqual({
          message: 'Headers recibidos',
          headers: mockHeaders,
          query: mockQuery,
          randomNumber: 42, // Ahora tenemos un número random
        });
      });
    });

    describe('callExternalService when URL is not configured', () => {
      it('should return error message when external service URL is not configured', async () => {
        const result = await appController.callExternalService();

        expect(result.success).toBe(false);
        expect(result.message).toContain(
          'No hay un servicio externo configurado',
        );
      });
    });
  });

  // Test suite para cuando el servicio externo SÍ está configurado
  describe('with external service configured', () => {
    beforeEach(async () => {
      // Mock de ConfigService con URL externa
      const mockConfigService = {
        get: jest.fn().mockImplementation((key, defaultValue) => {
          if (key === 'EXTERNAL_SERVICE_URL') {
            return 'http://test-api.example.com';
          }
          return defaultValue;
        }),
      };

      const app: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          { provide: AppService, useValue: mockAppService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      appController = app.get<AppController>(AppController);

      jest.clearAllMocks();
    });

    describe('callExternalService with success', () => {
      it('should return data from external service when call is successful', async () => {
        // Mock de respuesta exitosa
        const mockResponseData = {
          message: 'Headers received',
          headers: { 'x-request-id': '12345' },
          query: { random: '123' },
          randomNumber: 123,
        };

        // Verificar que la URL incluye el parámetro random
        mockedAxios.get.mockImplementation((url) => {
          expect(url).toMatch(/random=\d+/); // Verifica que la URL contiene 'random=<número>'
          return Promise.resolve({ data: mockResponseData });
        });

        const result = await appController.callExternalService();

        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockResponseData);
        expect(mockedAxios.get).toHaveBeenCalled();
      });
    });

    describe('callExternalService with error', () => {
      it('should handle errors when external service call fails', async () => {
        // Mock de error
        const networkError = new Error('Network error');
        mockedAxios.get.mockRejectedValue(networkError);

        const result = await appController.callExternalService();

        expect(result.success).toBe(false);
        expect(result.message).toContain('Network error');
      });
    });
  });

  // Test suite para health check
  describe('getHealth', () => {
    beforeEach(async () => {
      // Mock de ConfigService sin URL externa
      const mockConfigService = {
        get: jest.fn().mockImplementation((key, defaultValue) => {
          if (key === 'EXTERNAL_SERVICE_URL') {
            return ''; // URL vacía
          }
          return defaultValue;
        }),
      };

      const app: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          { provide: AppService, useValue: mockAppService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      appController = app.get<AppController>(AppController);

      jest.clearAllMocks();
    });

    it('debería devolver información completa de salud', () => {
      // Dada la naturaleza dinámica de timestamp, uptime y uso de memoria,
      // verificamos que existan los campos pero no sus valores exactos
      const healthData = appController.getHealth();

      // Verificamos la estructura completa
      expect(healthData).toHaveProperty('status', 'up');
      expect(healthData).toHaveProperty('uptime');
      expect(healthData).toHaveProperty('version');
      expect(healthData).toHaveProperty('memory');
      expect(healthData).toHaveProperty('timestamp');

      // Verificamos la estructura del objeto memory
      expect(healthData.memory).toHaveProperty('rss');
      expect(healthData.memory).toHaveProperty('heapTotal');
      expect(healthData.memory).toHaveProperty('heapUsed');

      // Verificamos que la versión sea la correcta
      expect(healthData.version).toBe('0.0.1'); // Asumiendo que es la versión del package.json

      // Verificamos formato de timestamp (debe ser un string con formato ISO)
      expect(typeof healthData.timestamp).toBe('string');
      expect(() => new Date(healthData.timestamp)).not.toThrow();
    });
  });

  // Test suite para status with details
  describe('getStatusWithDetails', () => {
    let originalNodeEnv;

    beforeAll(() => {
      originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
    });

    afterAll(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    beforeEach(async () => {
      const mockConfigService = {
        get: jest.fn().mockImplementation((key, defaultValue) => {
          if (key === 'EXTERNAL_SERVICE_URL') {
            return 'http://test-api.example.com';
          }
          if (key === 'NODE_ENV') {
            return 'test';
          }
          return defaultValue;
        }),
      };

      const app: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          { provide: AppService, useValue: mockAppService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      appController = app.get<AppController>(AppController);
      jest.clearAllMocks();
    });

    it('should return detailed status information', () => {
      const result = appController.getStatusWithDetails();

      // Verificar estructura y tipos de datos
      expect(result).toHaveProperty('status', 'up');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('environment', 'test');
      expect(result).toHaveProperty('system');
      expect(result.system).toHaveProperty('platform');
      expect(result.system).toHaveProperty('nodeVersion');
      expect(result.system).toHaveProperty('memory');
      expect(result.system.memory).toHaveProperty('rss');
      expect(result.system.memory).toHaveProperty('heapTotal');
      expect(result.system.memory).toHaveProperty('heapUsed');
      expect(result).toHaveProperty('dependencies');
      expect(result.dependencies).toHaveProperty('nestjs');
      expect(result.dependencies).toHaveProperty('axios');
      expect(result).toHaveProperty('externalServices');
      expect(result.externalServices).toHaveProperty('configured', true);
      expect(result).toHaveProperty('timestamp');
    });

    it('should show externalServices.configured as false when no external service is configured', async () => {
      // Reconfiguramos el controlador con un mock que devuelve URL vacía
      const mockConfigService = {
        get: jest.fn().mockImplementation((key, defaultValue) => {
          if (key === 'EXTERNAL_SERVICE_URL') {
            return ''; // URL vacía
          }
          if (key === 'NODE_ENV') {
            return 'test';
          }
          return defaultValue;
        }),
      };

      const app: TestingModule = await Test.createTestingModule({
        controllers: [AppController],
        providers: [
          { provide: AppService, useValue: mockAppService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const controller = app.get<AppController>(AppController);

      const result = controller.getStatusWithDetails();

      expect(result.externalServices.configured).toBe(false);
    });

    it('should handle errors gracefully and return minimal status info', () => {
      // Simular un error en process.memoryUsage()
      const originalMemoryUsage = process.memoryUsage;

      // Mock con tipado correcto para MemoryUsage
      const mockMemoryUsage = jest.fn().mockImplementation(() => {
        throw new Error('Error al obtener información de memoria');
      }) as jest.Mock & typeof process.memoryUsage;

      process.memoryUsage = mockMemoryUsage;

      try {
        const result = appController.getStatusWithDetails();

        // Verificar que devuelve un objeto con información mínima
        expect(result).toHaveProperty('status', 'up');
        expect(result).toHaveProperty(
          'error',
          'Error al obtener detalles del sistema',
        );
        expect(result).toHaveProperty(
          'message',
          'Error al obtener información de memoria',
        );
        expect(result).toHaveProperty('timestamp');
      } finally {
        // Restaurar la función original
        process.memoryUsage = originalMemoryUsage;
      }
    });
  });
});
