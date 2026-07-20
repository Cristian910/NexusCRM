import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsString, IsOptional, Min, Max, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsNumber()
  @Min(8)
  @Max(14)
  BCRYPT_ROUNDS: number = 12;

  // Redis — optional in development (queues degrade gracefully)
  @IsOptional()
  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number = 6379;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  // SMTP — optional; missing values disable email silently
  @IsOptional()
  @IsString()
  SMTP_HOST?: string;

  @IsOptional()
  @IsNumber()
  SMTP_PORT?: number;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  // Throttling
  @IsOptional()
  @IsNumber()
  THROTTLE_TTL: number = 60000;

  @IsOptional()
  @IsNumber()
  THROTTLE_LIMIT: number = 10;

  // Analytics cache TTLs
  @IsOptional()
  @IsNumber()
  ANALYTICS_CACHE_TTL: number = 300;

  @IsOptional()
  @IsNumber()
  ANALYTICS_CACHE_OVERVIEW_TTL: number = 60;
}

export function validateConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    throw new Error(`Config validation failed:\n  ${messages.join('\n  ')}`);
  }

  return validatedConfig;
}
