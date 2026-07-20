import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  errors?: string[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction = process.env.NODE_ENV === 'production';

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, errors } = this.resolveException(exception, request);

    const body: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
    };

    response.status(status).json(body);
  }

  private resolveException(
    exception: unknown,
    request: Request,
  ): { status: number; message: string; errors?: string[] } {
    // HttpException — framework-level (validation errors, guards, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'object' && raw !== null) {
        const resp = raw as Record<string, unknown>;
        if (Array.isArray(resp['message'])) {
          return { status, message: 'Validation failed', errors: resp['message'] as string[] };
        }
        return { status, message: (resp['message'] as string) || exception.message };
      }

      return { status, message: raw as string };
    }

    // Prisma known errors — convert to appropriate HTTP codes
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    // Prisma validation errors (bad query construction — should not reach production)
    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error('Prisma validation error (likely a bug)', exception.message);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: this.isProduction ? 'Internal server error' : exception.message,
      };
    }

    // Unknown / unhandled — log full stack, return generic message
    const err = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(
      `Unhandled exception on ${request.method} ${request.url}: ${err.message}`,
      err.stack,
    );

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      // Never expose internal error details in production
      message: this.isProduction ? 'Internal server error' : err.message,
    };
  }

  private resolvePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (error.code) {
      case 'P2002': {
        const fields = Array.isArray(error.meta?.['target'])
          ? (error.meta['target'] as string[]).join(', ')
          : 'field';
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with this ${fields} already exists`,
        };
      }
      case 'P2025':
        return { status: HttpStatus.NOT_FOUND, message: 'Record not found' };
      case 'P2003':
        return { status: HttpStatus.BAD_REQUEST, message: 'Related record not found' };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'The change would violate a required relation',
        };
      default:
        this.logger.error(`Unhandled Prisma error ${error.code}`, error.message);
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: this.isProduction ? 'Database error' : error.message,
        };
    }
  }
}
