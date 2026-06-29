import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Voting System API')
    .setDescription(
      `
## Blockchain-based Voting System with Facial Recognition

### Authentication
1. Login at POST /auth with username/password to get JWT token
2. Use token in Authorization header: Bearer <token>

### User Roles
- super-admin: Full system access
- admin: Administrative access
- owner: Object owner access
- write: Write operations
- read: Read-only access

### Complete Voting Flow
1. Register voter: POST /voting/voter/register
2. Approve voter: PUT /voting/voter/:id/approve
3. Create election: POST /voting/election
4. Activate election: PUT /voting/election/:id/activate
5. Cast vote: POST /voting/vote (requires face verification)

### Security
All endpoints (except /auth, /health) require JWT authentication.
    `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;

  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  logger.log(`API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
