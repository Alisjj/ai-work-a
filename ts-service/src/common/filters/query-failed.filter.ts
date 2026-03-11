import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  catch(exception: QueryFailedError & { code?: string }, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    // Postgres Error Codes
    const POSTGRES_FOREIGN_KEY_VIOLATION = '23503';
    const POSTGRES_UNIQUE_VIOLATION = '23505';
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception.code === POSTGRES_FOREIGN_KEY_VIOLATION) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid request parameters.';
    } else if (exception.code === POSTGRES_UNIQUE_VIOLATION) {
      status = HttpStatus.CONFLICT;
      message = 'Resource already exists.';
    }

    response.status(status).json({
      statusCode: status,
      error: HttpStatus[status],
      message,
    });
  }
}
