import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logsDir = path.join(process.cwd(), 'logs');
  private readonly maxLogSize = 10 * 1024 * 1024; // 10MB
  private readonly maxLogFiles = 7; // 7 días de logs

  constructor() {
    // Crear directorio de logs si no existe
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    // Limpiar logs antiguos al iniciar
    this.cleanOldLogs();
  }

  /**
   * Limpia logs antiguos que excedan el límite de días
   */
  private cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir);
      const now = Date.now();
      const maxAge = this.maxLogFiles * 24 * 60 * 60 * 1000; // días en ms

      files.forEach(file => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`[LOGGER] Archivo de log antiguo eliminado: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error limpiando logs antiguos:', error);
    }
  }

  /**
   * Verifica el tamaño del archivo y rota si es necesario
   */
  private checkAndRotateLog(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > this.maxLogSize) {
          const timestamp = Date.now();
          const rotatedPath = `${filePath}.${timestamp}`;
          fs.renameSync(filePath, rotatedPath);
          console.log(`[LOGGER] Log rotado: ${path.basename(rotatedPath)}`);
        }
      }
    } catch (error) {
      console.error('Error rotando log:', error);
    }
  }

  private writeToFile(level: string, message: any, context?: string, trace?: string) {
    const timestamp = new Date().toISOString();
    const fileName = `${new Date().toISOString().split('T')[0]}.log`;
    const filePath = path.join(this.logsDir, fileName);

    // Verificar y rotar log si es necesario
    this.checkAndRotateLog(filePath);

    const logEntry = {
      timestamp,
      level,
      context,
      message: typeof message === 'object' ? JSON.stringify(message, null, 2) : message,
      trace,
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      fs.appendFileSync(filePath, logLine, 'utf8');
    } catch (error) {
      console.error('Error escribiendo en archivo de log:', error);
    }
  }

  log(message: any, context?: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [LOG] ${context || ''}: ${message}`);
    // No escribir logs INFO en archivo para evitar saturación
  }

  error(message: any, trace?: string, context?: string) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] ${context || ''}: ${message}`, trace);
    // Solo errores se escriben en archivo
    this.writeToFile('ERROR', message, context, trace);
  }

  warn(message: any, context?: string) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] ${context || ''}: ${message}`);
    // Warnings también se escriben en archivo
    this.writeToFile('WARN', message, context);
  }

  debug(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.debug(`[${timestamp}] [DEBUG] ${context || ''}: ${message}`);
    }
    // No escribir debug en archivo
  }

  verbose(message: any, context?: string) {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [VERBOSE] ${context || ''}: ${message}`);
    }
    // No escribir verbose en archivo
  }

  /**
   * Método personalizado para errores detallados
   * Registra información completa del error incluyendo stack trace y contexto adicional
   */
  logError(error: any, context: string, additionalInfo?: any) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      statusCode: error.status || error.statusCode,
      code: error.code, // Para errores de Prisma
      meta: error.meta, // Metadata de Prisma
      additionalInfo,
      timestamp: new Date().toISOString(),
    };

    this.error(errorDetails, error.stack, context);
  }

  /**
   * Método para registrar operaciones de base de datos
   */
  logDatabaseOperation(operation: string, model: string, data?: any, error?: any) {
    const logEntry = {
      operation,
      model,
      data: data ? JSON.stringify(data) : undefined,
      error: error ? {
        message: error.message,
        code: error.code,
      } : undefined,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      this.error(logEntry, error.stack, `Database-${model}`);
    } else {
      this.log(logEntry, `Database-${model}`);
    }
  }

  /**
   * Método para registrar requests HTTP
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userAgent?: string,
    ip?: string,
  ) {
    const logEntry = {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      userAgent,
      ip,
      timestamp: new Date().toISOString(),
    };

    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'LOG';
    
    if (level === 'ERROR') {
      this.error(logEntry, undefined, 'HTTP');
    } else if (level === 'WARN') {
      this.warn(logEntry, 'HTTP');
    } else {
      this.log(logEntry, 'HTTP');
    }
  }

  /**
   * Método para registrar eventos de autenticación
   */
  logAuthEvent(event: string, userId?: string, email?: string, success: boolean = true, reason?: string) {
    const logEntry = {
      event,
      userId,
      email,
      success,
      reason,
      timestamp: new Date().toISOString(),
    };

    if (success) {
      this.log(logEntry, 'Auth');
    } else {
      this.warn(logEntry, 'Auth');
    }
  }
}
