import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    // Manejar errores HTTP de NestJS
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || message;
      errorCode = exception.name;
    }
    // Manejar errores de Prisma
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = exception.code;

      switch (exception.code) {
        case 'P2002':
          message = `Ya existe un registro con ese valor. Campo duplicado: ${this.extractFieldFromMeta(exception.meta)}`;
          status = HttpStatus.CONFLICT;
          break;
        case 'P2003':
          message = 'Error de clave foránea. El registro relacionado no existe.';
          break;
        case 'P2025':
          message = 'Registro no encontrado.';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2000':
          message = `El valor proporcionado es muy largo para el campo: ${this.extractFieldFromMeta(exception.meta)}`;
          break;
        case 'P2006':
          message = 'El valor proporcionado no es válido para el tipo de campo.';
          break;
        default:
          message = 'Error en la operación de base de datos.';
      }
    }
    // Manejar errores de validación de Prisma
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Error de validación en los datos proporcionados.';
      errorCode = 'VALIDATION_ERROR';
    }

    // Registrar el error
    this.logger.logError(
      exception,
      `${request.method} ${request.url}`,
      {
        body: request.body,
        params: request.params,
        query: request.query,
        user: (request as any).user?.id,
      },
    );

    // Responder al cliente
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errorCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    response.status(status).json(errorResponse);
  }

  private extractFieldFromMeta(meta: any): string {
    if (!meta) return 'desconocido';
    if (meta.target) return Array.isArray(meta.target) ? meta.target.join(', ') : meta.target;
    if (meta.field_name) return meta.field_name;
    if (meta.column_name) return meta.column_name;
    return 'desconocido';
  }
}
