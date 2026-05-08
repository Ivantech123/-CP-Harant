// Configuration schema with Zod validation
// Validates: Requirements 8.2, 8.5

import { z } from 'zod';

/**
 * Zod schema for server configuration
 * Validates all configuration sections: harant, http, cache, logging
 * Ensures URL formats, positive numbers, and enum values are correct
 */
export const ServerConfigSchema = z.object({
  harant: z.object({
    baseUrl: z.string().url('baseUrl must be a valid URL'),
    searchPath: z.string().min(1, 'searchPath cannot be empty'),
    profilePath: z.string().min(1, 'profilePath cannot be empty')
  }),
  http: z.object({
    timeout: z.number().positive('timeout must be a positive number'),
    maxRetries: z.number().int('maxRetries must be an integer').min(0, 'maxRetries must be at least 0').max(10, 'maxRetries cannot exceed 10'),
    retryDelay: z.number().positive('retryDelay must be a positive number')
  }),
  cache: z.object({
    enabled: z.boolean(),
    ttl: z.number().positive('ttl must be a positive number'),
    maxSize: z.number().int('maxSize must be an integer').positive('maxSize must be a positive number')
  }),
  logging: z.object({
    level: z.enum(['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'], {
      errorMap: () => ({ message: 'level must be one of: DEBUG, INFO, WARNING, ERROR, CRITICAL' })
    }),
    file: z.string().min(1, 'file path cannot be empty'),
    console: z.boolean()
  })
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type ServerConfig = z.infer<typeof ServerConfigSchema>;
