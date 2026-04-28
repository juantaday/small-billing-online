import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

@Module({
  imports: [],
})
class InvoiceApiModule {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(InvoiceApiModule);
  await app.listen(process.env.PORT || 3001);
}

bootstrap();
