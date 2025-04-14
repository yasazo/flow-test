import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from '../../src/app.service';
import { Logger } from '@nestjs/common';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AppService>(AppService);

    // Importante: aquí está el cambio principal
    // Mockear directamente el logger interno del servicio
    jest.spyOn(service['logger'], 'log').mockImplementation((message) => {
      // Simular el comportamiento del logger
      return message;
    });

    jest.spyOn(service['logger'], 'error').mockImplementation((message) => {
      // Simular el comportamiento del logger
      return message;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHello', () => {
    it('should return "Hello World!" and log the message', () => {
      const result = service.getHello();

      expect(result).toBe('Hello World!');
      expect(service['logger'].log).toHaveBeenCalledWith(
        'Hello world requested',
      );
    });
  });

  describe('methodThatWillFail', () => {
    it('should throw an error and log it', () => {
      expect(() => service.methodThatWillFail()).toThrow(
        'This is a failure in a service method',
      );
      expect(service['logger'].log).toHaveBeenCalledWith(
        'This method will throw an error',
      );
    });
  });
});
