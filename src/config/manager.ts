// Configuration Manager
// Validates: Requirements 8.1, 8.3, 8.4

import { readFileSync } from 'fs';
import { join } from 'path';
import { ServerConfigSchema, type ServerConfig } from './schema';
import { ZodError } from 'zod';

/**
 * Validation result for configuration
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

/**
 * Configuration Manager
 * Handles loading, validation, and default configuration
 * 
 * @example
 * ```typescript
 * const manager = new ConfigurationManager();
 * 
 * // Load from default location (config/default.json)
 * const config = manager.load();
 * 
 * // Load from custom path
 * const customConfig = manager.load('/path/to/config.json');
 * 
 * // Validate configuration
 * const result = manager.validate(someConfig);
 * if (!result.isValid) {
 *   console.error('Validation errors:', result.errors);
 * }
 * 
 * // Get defaults
 * const defaults = manager.getDefaults();
 * ```
 */
export class ConfigurationManager {
  /**
   * Load configuration from file or use defaults
   * @param path Optional path to configuration file (defaults to config/default.json)
   * @returns Validated server configuration
   * @throws Error if configuration is invalid
   */
  load(path?: string): ServerConfig {
    let config: unknown;

    // Determine config file path
    const configPath = path || join(process.cwd(), 'config', 'default.json');

    try {
      // Try to read config file
      const configContent = readFileSync(configPath, 'utf-8');
      config = JSON.parse(configContent);
    } catch (error) {
      // If file doesn't exist or can't be read, use defaults
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        console.warn(`Configuration file not found at ${configPath}, using defaults`);
        config = this.getDefaults();
      } else {
        // Re-throw other errors (e.g., JSON parse errors)
        throw new Error(`Failed to load configuration from ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Validate configuration
    const validationResult = this.validate(config);
    if (!validationResult.isValid) {
      throw new Error(`Configuration validation failed:\n${validationResult.errors?.join('\n')}`);
    }

    // Parse with Zod to get typed config (we know it's valid at this point)
    return ServerConfigSchema.parse(config);
  }

  /**
   * Validate configuration using Zod schema
   * @param config Configuration object to validate
   * @returns Validation result with descriptive errors
   */
  validate(config: unknown): ValidationResult {
    const result = ServerConfigSchema.safeParse(config);

    if (result.success) {
      return { isValid: true };
    }

    // Extract descriptive error messages from Zod errors
    const errors = result.error.issues.map(issue => {
      const path = issue.path.join('.');
      return `${path}: ${issue.message}`;
    });

    return {
      isValid: false,
      errors
    };
  }

  /**
   * Get default configuration values
   * @returns Default server configuration
   */
  getDefaults(): ServerConfig {
    return {
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
  }
}
