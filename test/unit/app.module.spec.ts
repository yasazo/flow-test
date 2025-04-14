import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { AppController } from '../../src/app.controller';
import { AppService } from '../../src/app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConsumer } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

// Mocks completos
jest.mock('../../src/app.controller', () => ({
  AppController: jest.fn().mockImplementation(() => ({
    getHello: jest.fn().mockReturnValue('Hello World!'),
  })),
}));

jest.mock('../../src/app.service', () => ({
  AppService: jest.fn().mockImplementation(() => ({
    getHello: jest.fn().mockReturnValue('Hello World!'),
    methodThatWillFail: jest.fn().mockImplementation(() => {
      throw new Error('Service failure test');
    }),
  })),
}));

jest.mock('@nestjs/config', () => ({
  ConfigModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class ConfigModuleMock {},
      providers: [],
    }),
  },
  ConfigService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockImplementation((key, defaultValue) => {
      if (key === 'EXTERNAL_SERVICE_URL') {
        return 'http://test-service.com';
      }
      return defaultValue;
    }),
  })),
}));

jest.mock('nestjs-pino', () => ({
  LoggerModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class LoggerModuleMock {},
      providers: [],
    }),
  },
  Logger: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// También necesitamos mockear el middleware
jest.mock('../../src/common/middlewares/request-id.middleware', () => ({
  requestIdMiddleware: jest.fn(),
}));

describe('AppModule', () => {
  // Usar la variable en los tests
  const testingModule = Test.createTestingModule({
    controllers: [AppController],
    providers: [
      AppService,
      {
        provide: ConfigService,
        useFactory: () => ({
          get: jest.fn().mockImplementation((key, defaultValue) => {
            if (key === 'EXTERNAL_SERVICE_URL') {
              return 'http://test-service.com';
            }
            return defaultValue;
          }),
        }),
      },
    ],
  });

  it('should instantiate AppController correctly', async () => {
    const module = await testingModule.compile();
    const controller = module.get<AppController>(AppController);
    expect(controller).toBeDefined();
  });

  it('should instantiate AppService correctly', async () => {
    const module = await testingModule.compile();
    const service = module.get<AppService>(AppService);
    expect(service).toBeDefined();
  });

  it('should implement NestModule and configure middleware', () => {
    // Crear una instancia de AppModule
    const appModule = new AppModule();
    expect(appModule).toBeDefined();

    // Verificar que tiene el método configure
    expect(typeof appModule.configure).toBe('function');

    // Mock de MiddlewareConsumer
    const mockConsumer = {
      apply: jest.fn().mockReturnThis(),
      forRoutes: jest.fn().mockReturnThis(),
    };

    // Llamar a configure
    appModule.configure(mockConsumer as unknown as MiddlewareConsumer);

    // Verificar la aplicación del middleware
    expect(mockConsumer.apply).toHaveBeenCalled();
  });

  it('should include ConfigModule and LoggerModule', () => {
    // Verificar que AppModule incluye los módulos esperados
    const AppModuleInstance = new AppModule();

    // No podemos verificar los imports directamente, así que verificamos que AppModule se haya inicializado correctamente
    expect(AppModuleInstance).toBeDefined();

    // Verificamos que se han importado los módulos mirando los mocks
    expect(ConfigModule.forRoot).toHaveBeenCalled();
    expect(LoggerModule.forRoot).toHaveBeenCalled();
  });
});
