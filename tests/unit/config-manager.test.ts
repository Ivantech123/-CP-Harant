// Unit tests for ConfigurationManager
// Validates: Requirements 8.1, 8.3, 8.4

import { describe, test, expect, beforeEach } from 'vitest';
import { ConfigurationManager } from '../../src/config/manager';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

describe('ConfigurationManager', () => {
  let manager: ConfigurationManager;
  const testConfigDir = join(process.cwd(), 'tests', 'fixtures', 'config');
  const testConfigPath = join(testConfigDir, 'test-config.json');

  beforeEach(() => {
    manager = new ConfigurationManager();
    
    // Ensure test config directory exists
    if (!existsSync(testConfigDir)) {
      mkdirSync(testConfigDir, { recursive: true });
    }
  });

  describe('load()', () => {
    test('should load valid configuration from file', () => {
      // Create a valid test config file
      const validConfig = {
        harant: {
          baseUrl: 'https://test.harant.ru',
          searchPath: '/search',
          profilePath: '/profile'
        },
        http: {
          timeout: 15000,
          maxRetries: 2,
          retryDelay: 500
        },
        cache: {
          enabled: false,
          ttl: 3600,
          maxSize: 500
        },
        logging: {
          level: 'DEBUG',
          file: 'test.log',
          console: false
        }
      };

      writeFileSync(testConfigPath, JSON.stringify(validConfig, null, 2));

      const config = manager.load(testConfigPath);

      expect(config.harant.baseUrl).toBe('https://test.harant.ru');
      expect(config.http.timeout).toBe(15000);
      expect(config.cache.enabled).toBe(false);
      expect(config.logging.level).toBe('DEBUG');

      // Cleanup
      unlinkSync(testConfigPath);
    });

    test('should use defaults when config file is missing', () => {
      const nonExistentPath = join(testConfigDir, 'non-existent.json');
      
      const config = manager.load(nonExistentPath);

      // Should return default values
      expect(config.harant.baseUrl).toBe('https://harant.ru');
      expect(config.http.timeout).toBe(30000);
      expect(config.cache.enabled).toBe(true);
      expect(config.logging.level).toBe('INFO');
    });

    test('should throw error for invalid JSON', () => {
      writeFileSync(testConfigPath, 'invalid json {{{');

      expect(() => manager.load(testConfigPath)).toThrow('Failed to load configuration');

      // Cleanup
      unlinkSync(testConfigPath);
    });

    test('should throw error for invalid configuration values', () => {
      const invalidConfig = {
        harant: {
          baseUrl: 'not-a-url',  // Invalid URL
          searchPath: '/search',
          profilePath: '/profile'
        },
        http: {
          timeout: -1000,  // Negative timeout
          maxRetries: 3,
          retryDelay: 1000
        },
        cache: {
          enabled: true,
          ttl: 86400,
          maxSize: 1000
        },
        logging: {
          level: 'INFO',
          file: 'test.log',
          console: true
        }
      };

      writeFileSync(testConfigPath, JSON.stringify(invalidConfig, null, 2));

      expect(() => manager.load(testConfigPath)).toThrow('Configuration validation failed');

      // Cleanup
      unlinkSync(testConfigPath);
    });

    test('should load default config file when no path provided', () => {
      const config = manager.load();

      // Should load from config/default.json
      expect(config.harant.baseUrl).toBe('https://harant.ru');
      expect(config.http.timeout).toBe(30000);
    });
  });

  describe('validate()', () => {
    test('should validate correct configuration', () => {
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
          level: 'INFO',
          file: 'harant-mcp.log',
          console: true
        }
      };

      const result = manager.validate(validConfig);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should return descriptive error for invalid baseUrl', () => {
      const invalidConfig = {
        harant: {
          baseUrl: 'not-a-valid-url',
          searchPath: '/search',
          profilePath: '/profile'
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
          level: 'INFO',
          file: 'test.log',
          console: true
        }
      };

      const result = manager.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0]).toContain('harant.baseUrl');
      expect(result.errors?.[0]).toContain('valid URL');
    });

    test('should return descriptive error for negative timeout', () => {
      const invalidConfig = {
        harant: {
          baseUrl: 'https://harant.ru',
          searchPath: '/search',
          profilePath: '/profile'
        },
        http: {
          timeout: -5000,
          maxRetries: 3,
          retryDelay: 1000
        },
        cache: {
          enabled: true,
          ttl: 86400,
          maxSize: 1000
        },
        logging: {
          level: 'INFO',
          file: 'test.log',
          console: true
        }
      };

      const result = manager.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('http.timeout');
      expect(result.errors?.[0]).toContain('positive number');
    });

    test('should return descriptive error for invalid log level', () => {
      const invalidConfig = {
        harant: {
          baseUrl: 'https://harant.ru',
          searchPath: '/search',
          profilePath: '/profile'
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
          level: 'INVALID_LEVEL',
          file: 'test.log',
          console: true
        }
      };

      const result = manager.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('logging.level');
    });

    test('should return multiple errors for multiple invalid fields', () => {
      const invalidConfig = {
        harant: {
          baseUrl: 'invalid-url',
          searchPath: '',  // Empty string
          profilePath: '/profile'
        },
        http: {
          timeout: -1000,  // Negative
          maxRetries: 3,
          retryDelay: 1000
        },
        cache: {
          enabled: true,
          ttl: 86400,
          maxSize: 1000
        },
        logging: {
          level: 'INFO',
          file: 'test.log',
          console: true
        }
      };

      const result = manager.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThanOrEqual(2);
      
      // Check that both errors are present
      const errorString = result.errors!.join(' ');
      expect(errorString).toContain('harant.baseUrl');
      expect(errorString).toContain('harant.searchPath');
    });

    test('should return error for missing required section', () => {
      const invalidConfig = {
        harant: {
          baseUrl: 'https://harant.ru',
          searchPath: '/search',
          profilePath: '/profile'
        },
        // Missing http section
        cache: {
          enabled: true,
          ttl: 86400,
          maxSize: 1000
        },
        logging: {
          level: 'INFO',
          file: 'test.log',
          console: true
        }
      };

      const result = manager.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('http');
    });

    test('should return error for maxRetries exceeding limit', () => {
      const invalidConfig = {
        harant: {
          baseUrl: 'https://harant.ru',
          searchPath: '/search',
          profilePath: '/profile'
        },
        http: {
          timeout: 30000,
          maxRetries: 15,  // Exceeds max of 10
          retryDelay: 1000
        },
        cache: {
          enabled: true,
          ttl: 86400,
          maxSize: 1000
        },
        logging: {
          level: 'INFO',
          file: 'test.log',
          console: true
        }
      };

      const result = manager.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('http.maxRetries');
      expect(result.errors?.[0]).toContain('10');
    });
  });

  describe('getDefaults()', () => {
    test('should return valid default configuration', () => {
      const defaults = manager.getDefaults();

      expect(defaults.harant.baseUrl).toBe('https://harant.ru');
      expect(defaults.harant.searchPath).toBe('/lawyers/search');
      expect(defaults.harant.profilePath).toBe('/lawyers/profile');
      expect(defaults.http.timeout).toBe(30000);
      expect(defaults.http.maxRetries).toBe(3);
      expect(defaults.http.retryDelay).toBe(1000);
      expect(defaults.cache.enabled).toBe(true);
      expect(defaults.cache.ttl).toBe(86400);
      expect(defaults.cache.maxSize).toBe(1000);
      expect(defaults.logging.level).toBe('INFO');
      expect(defaults.logging.file).toBe('harant-mcp.log');
      expect(defaults.logging.console).toBe(true);
    });

    test('should return configuration that passes validation', () => {
      const defaults = manager.getDefaults();
      const result = manager.validate(defaults);

      expect(result.isValid).toBe(true);
    });
  });

  describe('edge cases', () => {
    test('should handle empty searchPath', () => {
      const invalidConfig = {
        harant: {
          baseUrl: 'https://harant.ru',
          searchPath: '',
          profilePath: '/profile'
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
          level: 'INFO',
          file: 'test.log',
          console: true
        }
      };

      const result = manager.validate(invalidConfig);

      expect(result.isValid).toBe(false);
      expect(result.errors?.[0]).toContain('searchPath');
      expect(result.errors?.[0]).toContain('empty');
    });

    test('should handle zero maxRetries', () => {
      const validConfig = {
        harant: {
          baseUrl: 'https://harant.ru',
          searchPath: '/search',
          profilePath: '/profile'
        },
        http: {
          timeout: 30000,
          maxRetries: 0,  // Zero is valid
          retryDelay: 1000
        },
        cache: {
          enabled: true,
          ttl: 86400,
          maxSize: 1000
        },
        logging: {
          level: 'INFO',
          file: 'test.log',
          console: true
        }
      };

      const result = manager.validate(validConfig);

      expect(result.isValid).toBe(true);
    });

    test('should handle all valid log levels', () => {
      const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];

      for (const level of logLevels) {
        const config = {
          harant: {
            baseUrl: 'https://harant.ru',
            searchPath: '/search',
            profilePath: '/profile'
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
            level: level,
            file: 'test.log',
            console: true
          }
        };

        const result = manager.validate(config);
        expect(result.isValid).toBe(true);
      }
    });
  });
});
