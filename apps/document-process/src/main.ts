import { NestFactory } from '@nestjs/core';
import { DocumentProcessModule } from './document-process.module';

async function bootstrap() {
  const app = await NestFactory.create(DocumentProcessModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
