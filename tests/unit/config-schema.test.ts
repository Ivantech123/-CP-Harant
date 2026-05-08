// Unit tests for configuration schema validation
// Validates: Requirements 8.2, 8.5

import { describe, test, expect } from 'vitest';
import { ServerConfigSchema } from '../../src/config/schema';

describe('ServerConfigSchema', () => {
  const validConfig = {
    harant: {
      baseUrl: 'https://harant.ru',
      searchPath: '/lawyers/search',
      profilePath: '/lawyers/profile'
    },
    http: {
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000
    },
    cache: {
      enabled: true,
      ttl: 86400,
      maxSize: 1000
    },
    logging: {
      level: 'INFO' as const,
      file: 'harant-mcp.log',
      console: true
    }
  };

  describe('Valid configurations', () => {
    test('should accept valid configuration', () => {
      const result = ServerConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    test('should accept all valid log levels', () => {
      const levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const;
      
      for (const level of levels) {
        const config = { ...validConfig, logging: { ...validConfig.logging, level } };
        const result = ServerConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      }
    });

    test('should accept maxRetries of 0', () => {
      const config = { ...validConfig, http: { ...validConfig.http, maxRetries: 0 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('should accept maxRetries of 10', () => {
      const config = { ...validConfig, http: { ...validConfig.http, maxRetries: 10 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    test('should accept cache disabled', () => {
      const config = { ...validConfig, cache: { ...validConfig.cache, enabled: false } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid harant configuration', () => {
    test('should reject invalid URL format', () => {
      const config = { ...validConfig, harant: { ...validConfig.harant, baseUrl: 'not-a-url' } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid URL');
      }
    });

    test('should reject empty searchPath', () => {
      const config = { ...validConfig, harant: { ...validConfig.harant, searchPath: '' } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    test('should reject empty profilePath', () => {
      const config = { ...validConfig, harant: { ...validConfig.harant, profilePath: '' } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });
  });

  describe('Invalid http configuration', () => {
    test('should reject negative timeout', () => {
      const config = { ...validConfig, http: { ...validConfig.http, timeout: -1 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    test('should reject zero timeout', () => {
      const config = { ...validConfig, http: { ...validConfig.http, timeout: 0 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    test('should reject negative maxRetries', () => {
      const config = { ...validConfig, http: { ...validConfig.http, maxRetries: -1 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 0');
      }
    });

    test('should reject maxRetries greater than 10', () => {
      const config = { ...validConfig, http: { ...validConfig.http, maxRetries: 11 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 10');
      }
    });

    test('should reject non-integer maxRetries', () => {
      const config = { ...validConfig, http: { ...validConfig.http, maxRetries: 3.5 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer');
      }
    });

    test('should reject negative retryDelay', () => {
      const config = { ...validConfig, http: { ...validConfig.http, retryDelay: -100 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    test('should reject zero retryDelay', () => {
      const config = { ...validConfig, http: { ...validConfig.http, retryDelay: 0 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });
  });

  describe('Invalid cache configuration', () => {
    test('should reject negative ttl', () => {
      const config = { ...validConfig, cache: { ...validConfig.cache, ttl: -1 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    test('should reject zero ttl', () => {
      const config = { ...validConfig, cache: { ...validConfig.cache, ttl: 0 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    test('should reject negative maxSize', () => {
      const config = { ...validConfig, cache: { ...validConfig.cache, maxSize: -1 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    test('should reject zero maxSize', () => {
      const config = { ...validConfig, cache: { ...validConfig.cache, maxSize: 0 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    test('should reject non-integer maxSize', () => {
      const config = { ...validConfig, cache: { ...validConfig.cache, maxSize: 100.5 } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('integer');
      }
    });
  });

  describe('Invalid logging configuration', () => {
    test('should reject invalid log level', () => {
      const config = { ...validConfig, logging: { ...validConfig.logging, level: 'INVALID' as any } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('DEBUG, INFO, WARNING, ERROR, CRITICAL');
      }
    });

    test('should reject empty file path', () => {
      const config = { ...validConfig, logging: { ...validConfig.logging, file: '' } };
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });
  });

  describe('Missing required fields', () => {
    test('should reject missing harant section', () => {
      const config = { ...validConfig };
      delete (config as any).harant;
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    test('should reject missing http section', () => {
      const config = { ...validConfig };
      delete (config as any).http;
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    test('should reject missing cache section', () => {
      const config = { ...validConfig };
      delete (config as any).cache;
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    test('should reject missing logging section', () => {
      const config = { ...validConfig };
      delete (config as any).logging;
      const result = ServerConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });
});
