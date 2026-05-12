import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;
  const frontendUrl = configService.get<string>('frontendUrl');
  const nodeEnv = configService.get<string>('nodeEnv');

  app.enableCors({
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Cleaning SaaS API')
      .setDescription('REST API for the Cleaning SaaS platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`)
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`Application running on port ${port}`);
}

bootstrap();
