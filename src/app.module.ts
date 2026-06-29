import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { validate } from './env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { InitialiserModule } from './modules/initialiser/initialiser.module';
import { UsersModule } from './modules/users/users.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { FacialRecognitionModule } from './modules/facial-recognition/facial-recognition.module';
import { VotingModule } from './modules/voting/voting.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.production', '.env'],
      isGlobal: true,
      validate: validate,
      ignoreEnvVars: true,
      ignoreEnvFile: false,
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URL ||
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017',
      {
        dbName: process.env.MONGO_DB_NAME || 'app_backend',
      },
    ),
    ClientsModule.register([
      {
        name: 'BLOCKCHAIN_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.BLOCKCHAIN_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.BLOCKCHAIN_SERVICE_PORT, 10) || 3001,
        },
      },
    ]),
    AuthModule,
    InitialiserModule,
    UsersModule,
    BlockchainModule,
    FacialRecognitionModule,
    VotingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [BlockchainModule],
})
export class AppModule {}
