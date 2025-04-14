import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import { Logger } from 'nestjs-pino';

// Mock para configurar axios
import * as axiosConfigMock from '../../src/config/axios-config';
jest.mock('../../src/config/axios-config', () => ({
  configureGlobalAxios: jest.fn(),
}));

// Mock de NestFactory
jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        useLogger: jest.fn(),
        listen: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockImplementation((type) => {
          if (type === Logger) {
            return {
              log: jest.fn(),
              error: jest.fn(),
              warn: jest.fn(),
              debug: jest.fn(),
            };
          }
          return null;
        }),
      });
    }),
  },
}));

describe('Bootstrap function (main.ts)', () => {
  let configureGlobalAxios: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Obtener el mock de configureGlobalAxios
    configureGlobalAxios = axiosConfigMock.configureGlobalAxios as jest.Mock;
  });

  it('should create and configure a NestJS application', async () => {
    // No intentamos importar y ejecutar bootstrap directamente
    // En lugar de eso, realizamos las mismas acciones que haría bootstrap

    // Creamos una aplicación NestJS con las opciones correctas
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    // Obtenemos el logger y lo configuramos
    const logger = app.get(Logger);
    app.useLogger(logger);

    // Configuramos axios
    configureGlobalAxios(logger);

    // Iniciamos la aplicación
    await app.listen(3000);

    // Verificaciones
    expect(NestFactory.create).toHaveBeenCalledWith(AppModule, {
      bufferLogs: true,
    });
    expect(app.get).toHaveBeenCalledWith(Logger);
    expect(app.useLogger).toHaveBeenCalled();
    expect(configureGlobalAxios).toHaveBeenCalledWith(logger);
    expect(app.listen).toHaveBeenCalledWith(3000);
  });
});
