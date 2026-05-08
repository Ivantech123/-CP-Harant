// Configuration types
// Validates: Requirements 6.4

/**
 * Log level for the logger
 */
export type LogLevel = "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";

/**
 * Server configuration interface
 * Contains all configuration parameters for the MCP server
 */
export interface ServerConfig {
  /** Harant portal configuration */
  harant: {
    /** Base URL of the Harant portal */
    baseUrl: string;
    /** Search endpoint path */
    searchPath: string;
    /** Profile endpoint path */
    profilePath: string;
  };
  /** HTTP client configuration */
  http: {
    /** Request timeout in milliseconds */
    timeout: number;
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Initial retry delay in milliseconds */
    retryDelay: number;
  };
  /** Cache configuration */
  cache: {
    /** Whether caching is enabled */
    enabled: boolean;
    /** Time-to-live for cache entries in seconds */
    ttl: number;
    /** Maximum number of cache entries */
    maxSize: number;
  };
  /** Logging configuration */
  logging: {
    /** Log level */
    level: LogLevel;
    /** Log file path */
    file: string;
    /** Whether to log to console */
    console: boolean;
  };
}
