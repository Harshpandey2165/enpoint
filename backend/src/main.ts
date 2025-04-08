import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: process.env.CORS_HEADERS || 'Content-Type,Authorization',
    });

    // Parse cookies
    app.use(cookieParser());

    // Use global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // Get port from environment
    const port = parseInt(process.env.PORT) || 3001;

    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error('Error starting the application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('Bootstrap error:', error);
  process.exit(1);
});
