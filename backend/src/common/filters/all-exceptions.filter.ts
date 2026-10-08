import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';
import type { RequestWithContext } from '../http/request-context';
import { toErrorResponse } from '../errors/to-error-response';

/** Bắt mọi lỗi, trả {error:{code,message,details,requestId}}. Lỗi 5xx ghi log kèm requestId. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const req = http.getRequest<RequestWithContext>();
    const res = http.getResponse<Response>();
    const { status, body } = toErrorResponse(exception);
    const requestId = req.requestId ?? null;

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`[${requestId}] ${req.method} ${req.originalUrl}`, stack);
    }

    res.status(status).json({ error: { ...body, requestId } });
  }
}
