import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Obtener instancia del LoggerService
  const logger = app.get(LoggerService);
  
  // Configurar logger global
  app.useLogger(logger);
  
  // Aplicar interceptor de logging globalmente
  app.useGlobalInterceptors(new LoggingInterceptor(logger));
  
  // CORS para frontend
  app.enableCors({
    origin: 'http://localhost:5173', // Puerto de Vite
    credentials: true,
  });
  
  await app.listen(3001);
  logger.log('Backend running on http://localhost:3001', 'Bootstrap');
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
}
bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});