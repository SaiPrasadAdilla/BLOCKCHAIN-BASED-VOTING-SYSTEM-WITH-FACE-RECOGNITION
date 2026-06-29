import { validate } from './env.validation';

describe('EnvValidation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validate', () => {
    it('should validate and return config object with all required env vars', () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';
      process.env.MONGO_URL = 'mongodb://localhost:27017';
      process.env.MONGODB_URI = 'mongodb://localhost:27017';
      process.env.MONGO_DB_NAME = 'test_db';
      process.env.admin_username = 'admin@test.com';
      process.env.admin_password = 'password123';
      process.env.salt_rounds = '10';
      process.env.secret_key = 'testsecret123';
      process.env.expires_in = '3600';

      const config = {
        NODE_ENV: 'development',
        PORT: '3000',
        MONGO_URL: 'mongodb://localhost:27017',
        MONGODB_URI: 'mongodb://localhost:27017',
        MONGO_DB_NAME: 'test_db',
        admin_username: 'admin@test.com',
        admin_password: 'password123',
        salt_rounds: '10',
        secret_key: 'testsecret123',
        expires_in: '3600',
      };

      const result = validate(config);

      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe('development');
      expect(result.PORT).toBe(3000);
    });

    it('should handle missing optional env vars with defaults', () => {
      const config: Record<string, unknown> = {};

      const result = validate(config);

      expect(result).toBeDefined();
    });

    it('should convert string PORT to number', () => {
      const config = {
        PORT: '8080',
      };

      const result = validate(config);

      expect(result.PORT).toBe(8080);
      expect(typeof result.PORT).toBe('number');
    });

    it('should allow production NODE_ENV', () => {
      const config = {
        NODE_ENV: 'production',
      };

      const result = validate(config);

      expect(result.NODE_ENV).toBe('production');
    });

    it('should allow staging NODE_ENV', () => {
      const config = {
        NODE_ENV: 'staging',
      };

      const result = validate(config);

      expect(result.NODE_ENV).toBe('staging');
    });

    it('should allow testing NODE_ENV', () => {
      const config = {
        NODE_ENV: 'testing',
      };

      const result = validate(config);

      expect(result.NODE_ENV).toBe('testing');
    });

    it('should allow development NODE_ENV', () => {
      const config = {
        NODE_ENV: 'development',
      };

      const result = validate(config);

      expect(result.NODE_ENV).toBe('development');
    });

    it('should handle config with only NODE_ENV', () => {
      const config = {
        NODE_ENV: 'development',
      };

      const result = validate(config);

      expect(result).toBeDefined();
      expect(result.NODE_ENV).toBe('development');
    });

    it('should handle config with alphanumeric secret_key', () => {
      const config = {
        secret_key: 'abc123ABC',
      };

      const result = validate(config);

      expect(result.secret_key).toBe('abc123ABC');
    });

    it('should handle config with numeric expires_in', () => {
      const config = {
        expires_in: '86400',
      };

      const result = validate(config);

      expect(result.expires_in).toBe(86400);
    });

    it('should handle config with numeric salt_rounds', () => {
      const config = {
        salt_rounds: '12',
      };

      const result = validate(config);

      expect(result.salt_rounds).toBe(12);
    });

    it('should return validated config object', () => {
      const config: Record<string, unknown> = {
        NODE_ENV: 'production',
      };

      const result = validate(config);

      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    });
  });
});
