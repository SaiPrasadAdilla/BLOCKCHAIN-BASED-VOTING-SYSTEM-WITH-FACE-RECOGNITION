import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  IsAlphanumeric,
  validateSync,
} from 'class-validator';
import { Logger } from '@nestjs/common';

enum Environment {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
  Test = 'testing',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment;

  @IsNumber()
  @IsOptional()
  PORT: number;

  @IsString()
  @IsOptional()
  MONGO_URL: string;

  @IsString()
  @IsOptional()
  MONGODB_URI: string;

  @IsString()
  @IsOptional()
  MONGO_DB_NAME: string;

  @IsString()
  @IsOptional()
  SQL_HOSTNAME: string;

  @IsString()
  @IsOptional()
  SQL_USERNAME: string;

  @IsNumber()
  @IsOptional()
  SQL_PORT: number;

  @IsString()
  @IsOptional()
  SQL_PASSWORD: string;

  @IsEmail()
  @IsOptional()
  admin_username: string;

  @IsString()
  @IsOptional()
  admin_password: string;

  @IsNumber()
  @IsOptional()
  salt_rounds: number;

  @IsAlphanumeric()
  @IsOptional()
  secret_key: string;

  @IsNumber()
  @IsOptional()
  expires_in: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length <= 0) {
    Logger.log('Environment variables validated successfully', 'EnvValidation');
  } else {
    Logger.warn(
      `Environment validation warnings: ${errors
        .map((e) => e.property)
        .join(', ')}`,
      'EnvValidation',
    );
  }

  return validatedConfig;
}
