import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('BlockchainMicroservice');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    BlockchainModule,
    {
      transport: Transport.TCP,
      options: {
        host: process.env.BLOCKCHAIN_SERVICE_HOST || '0.0.0.0',
        port: parseInt(process.env.BLOCKCHAIN_SERVICE_PORT, 10) || 3001,
        retryAttempts: 5,
        retryDelay: 3000,
      },
    },
  );

  await app.listen();
  logger.log('Blockchain microservice is listening on port 3001');
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
