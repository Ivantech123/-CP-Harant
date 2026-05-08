// Error types
// Validates: Requirements 4.1, 6.4

/**
 * Error type categories for the MCP server
 */
export enum ErrorType {
  /** Network connection error */
  NETWORK_ERROR = "NETWORK_ERROR",
  /** Request timeout error */
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  /** HTML parsing error */
  PARSE_ERROR = "PARSE_ERROR",
  /** Input validation error */
  VALIDATION_ERROR = "VALIDATION_ERROR",
  /** Resource not found (404) */
  NOT_FOUND_ERROR = "NOT_FOUND_ERROR",
  /** Configuration error */
  CONFIG_ERROR = "CONFIG_ERROR",
  /** Cache operation error */
  CACHE_ERROR = "CACHE_ERROR"
}

/**
 * MCP error interface with detailed error information
 */
export interface MCPError {
  /** Type of error */
  type: ErrorType;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: string;
  /** Timestamp when the error occurred */
  timestamp: Date;
  /** Whether the operation can be retried */
  retryable: boolean;
}
