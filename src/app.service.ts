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
    throw new Error('This is a failure in a service method');
  }

  getTest(): string {
    return 'Test method';
  }
}
