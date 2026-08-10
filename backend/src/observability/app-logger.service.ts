import { ConsoleLogger, Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export const correlationIdAls = new AsyncLocalStorage<string>();

@Injectable()
export class AppLogger extends ConsoleLogger {
  private getPrefix(): string {
    const correlationId = correlationIdAls.getStore();
    return correlationId ? `[Correlation ID: ${correlationId}] ` : '';
  }

  log(message: any, ...optionalParams: any[]) {
    super.log(`${this.getPrefix()}${message}`, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    super.error(`${this.getPrefix()}${message}`, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    super.warn(`${this.getPrefix()}${message}`, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    super.debug(`${this.getPrefix()}${message}`, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    super.verbose(`${this.getPrefix()}${message}`, ...optionalParams);
  }
}
