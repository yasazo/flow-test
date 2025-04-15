import { Injectable, Logger } from '@nestjs/common';

// Service class for the application
@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  getHello(): string {
    this.logger.log('Hello world requested');
    return 'Hello World!';
  }

  methodThatWillFail(): string {
    this.logger.log('This method will throw an error');
    try {
      // Simulamos una operación que podría fallar
      const result = this.performComplexOperation();
      this.logger.log('Operation completed successfully');
      return result;
    } catch (error) {
      this.logger.error(`Error en la operación: ${error.message}`, error.stack);
      throw new Error(`Operación fallida: ${error.message}`);
    }
  }

  private performComplexOperation(): string {
    // Este método ahora devuelve un resultado exitoso después del hotfix
    return 'Operación completada con éxito';
  }

  getTest(): string {
    return 'Test method';
  }
}
