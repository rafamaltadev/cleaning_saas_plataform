import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const code =
      exception instanceof HttpException
        ? exception.constructor.name.replace('Exception', '').toUpperCase()
        : 'INTERNAL_SERVER_ERROR';

    const rawMessage =
      exception instanceof HttpException
        ? (exception.getResponse() as any).message || exception.message
        : 'Internal server error';

    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : String(rawMessage);

    this.logger.error(`${request.method} ${request.url} - ${status}: ${message}`);

    response.status(status).json({
      error: { code, message },
    });
  }
}
