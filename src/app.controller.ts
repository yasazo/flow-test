import {
  Controller,
  Get,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  Logger,
  Headers,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import packageInfo from '../package.json';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  private readonly externalServiceUrl: string;
  private readonly startTime: number;

  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {
    this.startTime = Date.now();
    this.externalServiceUrl = this.configService.get<string>(
      'EXTERNAL_SERVICE_URL',
      '',
    );
    if (this.externalServiceUrl) {
      this.logger.log(
        `Configurado para comunicarse con servicio externo: ${this.externalServiceUrl}`,
      );
    } else {
      this.logger.log('No se ha configurado un servicio externo');
    }
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Endpoint para verificar la salud de la aplicación
   * Útil para Kubernetes liveness/readiness probes
   */
  @Get('healthz')
  getHealth(): any {
    this.logger.log('Health check solicitado');

    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();

    return {
      status: 'up',
      uptime: `${uptime} segundos`,
      version: packageInfo.version,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Endpoint para obtener un estado detallado del sistema
   * Proporciona información extendida sobre la aplicación y su entorno
   */
  @Get('status/details')
  getStatusWithDetails(): any {
    this.logger.log('Status detallado solicitado');

    try {
      const uptime = Math.floor((Date.now() - this.startTime) / 1000);
      const memoryUsage = process.memoryUsage();
      const environment = this.configService.get<string>(
        'NODE_ENV',
        'development',
      );

      return {
        status: 'up',
        uptime: `${uptime} segundos`,
        version: packageInfo.version,
        environment,
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          },
        },
        dependencies: {
          nestjs: packageInfo.dependencies['@nestjs/core'],
          axios: packageInfo.dependencies.axios,
        },
        externalServices: {
          configured: !!this.externalServiceUrl,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error al obtener el estado detallado: ${error.message}`,
        error.stack,
      );

      // Devolver una respuesta mínima pero funcional en caso de error
      return {
        status: 'up', // La aplicación sigue funcionando aunque no podamos obtener todos los detalles
        error: 'Error al obtener detalles del sistema',
        message: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('test-error/nestjs')
  testNestError(): string {
    throw new BadRequestException('Bad request error from NestJS');
  }

  @Get('test-error/runtime')
  testRuntimeError(): void {
    const obj = undefined;
    obj.someProperty = 'This will throw a TypeError';
  }

  @Get('test-error/service')
  testServiceError(): string {
    try {
      return this.appService.methodThatWillFail();
    } catch (error) {
      this.logger.error('Error occurred in service', error.stack);

      throw new InternalServerErrorException({
        message: 'Service error occurred',
        originalError: error.message,
      });
    }
  }

  @Get('test-error/not-found')
  testNotFoundException(): string {
    throw new NotFoundException('Resource not found');
  }

  @Get('headers')
  getHeaders(
    @Headers() headers: Record<string, string>,
    @Query() query: Record<string, string>,
  ): any {
    this.logger.log('Mostrando headers de la solicitud');
    const randomValue = query.random;
    if (randomValue) {
      this.logger.log(`Número aleatorio recibido: ${randomValue}`);
    }

    return {
      message: 'Headers recibidos',
      headers,
      query,
      randomNumber: randomValue ? parseInt(randomValue, 10) : undefined,
    };
  }

  @Get('call-external')
  async callExternalService(): Promise<any> {
    this.logger.log('Solicitando datos del servicio externo');
    const randomNumber = Math.floor(Math.random() * 1000) + 1;
    if (!this.externalServiceUrl) {
      this.logger.warn('No se ha configurado un servicio externo para llamar');
      return {
        success: false,
        message:
          'No hay un servicio externo configurado. Configure la variable de entorno EXTERNAL_SERVICE_URL.',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      this.logger.log(
        `Llamando al servicio: ${this.externalServiceUrl} con ${randomNumber}`,
      );
      const response = await axios.get(
        `${this.externalServiceUrl}/headers?random=${randomNumber}`,
      );
      this.logger.log('Respuesta recibida del servicio externo');
      return {
        success: true,
        message: 'Datos recibidos del servicio externo',
        timestamp: new Date().toISOString(),
        data: response.data,
      };
    } catch (error) {
      this.logger.error(
        `Error al llamar al servicio externo: ${error.message}`,
      );
      return {
        success: false,
        message: `Error al llamar al servicio externo: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
