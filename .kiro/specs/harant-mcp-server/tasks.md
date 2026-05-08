# Implementation Plan: Harant MCP Server

## Overview

This implementation plan breaks down the Harant MCP Server into discrete coding tasks. The server is a TypeScript/Node.js application that implements the Model Context Protocol (MCP) to integrate the Harant legal portal (https://harant.ru/) with AI models. The implementation follows a layered architecture with core components for HTTP communication, HTML parsing, caching, data formatting, configuration management, and logging.

## Tasks

- [x] 1. Set up project structure and core dependencies
  - Initialize TypeScript/Node.js project with package.json
  - Install core dependencies: @modelcontextprotocol/sdk, axios, cheerio, node-cache, winston, zod
  - Install dev dependencies: typescript, vitest, fast-check, @types/node
  - Create tsconfig.json with strict type checking enabled
  - Set up project directory structure (src/, tests/, config/)
  - Create .gitignore file
  - _Requirements: 5.1, 8.1_

- [x] 2. Implement type definitions and data models
  - [x] 2.1 Create core TypeScript interfaces and types
    - Define LawyerSearchResult interface in src/types/lawyer.ts
    - Define LawyerProfile interface with all fields (name, city, specialization, experience, contacts, rating, description, education, languages, achievements)
    - Define ContactInfo interface
    - Define ErrorType enum and MCPError interface in src/types/errors.ts
    - Define ServerConfig interface and LogLevel type in src/types/config.ts
    - _Requirements: 2.2, 4.1, 6.4_

  - [ ]* 2.2 Write property test for LawyerProfile required fields
    - **Property 2: LawyerProfile Contains Required Fields**
    - **Validates: Requirements 2.2**
    - Create custom generator for LawyerProfile objects using fast-check
    - Test that all valid LawyerProfile objects contain required fields: name, city, specialization (non-empty array), experience, contacts
    - _Requirements: 2.2_

- [ ] 3. Implement configuration management
  - [x] 3.1 Create configuration schema with Zod
    - Define ServerConfigSchema in src/config/schema.ts using Zod
    - Include validation for all config sections: harant, http, cache, logging
    - Validate URL formats, positive numbers, enum values
    - _Requirements: 8.2, 8.5_

  - [x] 3.2 Implement configuration manager
    - Create ConfigurationManager class in src/config/manager.ts
    - Implement load() method to read config from file or use defaults
    - Implement validate() method using Zod schema
    - Implement getDefaults() method with default configuration values
    - Handle missing config file gracefully (use defaults)
    - Return descriptive validation errors for invalid config values
    - _Requirements: 8.1, 8.3, 8.4_

  - [ ]* 3.3 Write property test for configuration validation
    - **Property 7: Configuration Validation Completeness**
    - **Validates: Requirements 8.2**
    - Generate various ServerConfig objects with missing or invalid sections
    - Test that validator verifies all required sections (harant, http, cache, logging) are present
    - Test that validator checks required parameters in each section
    - _Requirements: 8.2_

  - [ ]* 3.4 Write property test for input validation errors
    - **Property 1: Input Validation Produces Descriptive Errors**
    - **Validates: Requirements 1.5, 2.4, 8.4**
    - Create generators for invalid URLs, invalid parameters, invalid config values
    - Test that validation logic returns descriptive error messages
    - Verify error messages identify specific validation failures
    - _Requirements: 1.5, 2.4, 8.4_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement logging system
  - [ ] 5.1 Create Winston logger setup
    - Create Logger class in src/logger/logger.ts
    - Configure Winston with file and console transports
    - Implement log methods: debug(), info(), warning(), error(), critical()
    - Add timestamp formatting (ISO 8601)
    - Configure log rotation (10MB file size limit)
    - Support configurable log levels from configuration
    - _Requirements: 9.1, 9.2, 9.4, 9.5_

  - [ ]* 5.2 Write unit tests for logger
    - Test that logger writes to both file and console
    - Test log level filtering
    - Test metadata inclusion in log entries
    - _Requirements: 9.5_

- [ ] 6. Implement HTTP client with retry logic
  - [ ] 6.1 Create HTTP client class
    - Create HTTPClient class in src/http/client.ts
    - Implement get() method using axios
    - Configure default timeout (30 seconds)
    - Set proper headers for Cyrillic text handling (Accept-Charset: utf-8)
    - Handle axios errors and convert to MCPError types
    - _Requirements: 6.1, 6.2, 3.2_

  - [ ] 6.2 Implement retry logic with exponential backoff
    - Implement fetchWithRetry() function
    - Retry up to 3 times for retryable errors (ECONNREFUSED, ETIMEDOUT, ENOTFOUND, 5xx)
    - Use exponential backoff (1s, 2s, 4s delays)
    - Log each retry attempt with warning level
    - Do not retry on 4xx client errors
    - _Requirements: 6.3_

  - [ ]* 6.3 Write unit tests for HTTP client
    - Test timeout behavior (30 second limit)
    - Test retry logic with mock network errors
    - Test exponential backoff delays
    - Test that 4xx errors are not retried
    - Test Cyrillic text encoding in responses
    - _Requirements: 6.2, 6.3, 3.2_

- [ ] 7. Implement cache manager
  - [ ] 7.1 Create cache manager class
    - Create CacheManager class in src/cache/manager.ts
    - Use node-cache library for in-memory caching
    - Implement get(), set(), has(), clear() methods
    - Configure TTL (24 hours default) and max size (1000 entries)
    - Implement getStats() method to track hits, misses, hit rate
    - Use Profile_URL as cache key
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 7.2 Write property test for cache key generation
    - **Property 6: Cache Key Generation from URL**
    - **Validates: Requirements 7.4**
    - Generate various valid profile URLs
    - Test that same URL always produces same cache key
    - Test that different URLs produce different cache keys
    - _Requirements: 7.4_

  - [ ]* 7.3 Write unit tests for cache manager
    - Test cache set and get operations
    - Test TTL expiration behavior
    - Test cache statistics tracking
    - Test max size enforcement (LRU eviction)
    - _Requirements: 7.2, 7.5_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement HTML parsers
  - [ ] 9.1 Create search results parser
    - Create parseSearchResults() function in src/parser/search-parser.ts
    - Use Cheerio to parse HTML with CSS selectors
    - Extract lawyer cards with name, city, specialization, profileUrl, rating
    - Normalize text (trim, remove extra whitespace)
    - Handle empty search results (return empty array)
    - Handle Cyrillic characters correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2_

  - [ ] 9.2 Create profile parser
    - Create parseLawyerProfile() function in src/parser/profile-parser.ts
    - Extract all profile fields: name, city, specialization[], experience, contacts, rating, description, education, languages, achievements
    - Validate that required fields (name, city, specialization, experience, contacts) are present
    - Return descriptive error if required field is missing
    - Handle optional fields gracefully
    - Handle Cyrillic characters correctly
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.5_

  - [ ] 9.3 Implement HTML structure validation
    - Create validateStructure() function in src/parser/profile-parser.ts
    - Check for expected CSS selectors in HTML
    - Return validation result with missing selectors and warnings
    - Log warnings when HTML structure differs from expected
    - _Requirements: 3.3_

  - [ ]* 9.4 Write property test for Cyrillic text preservation
    - **Property 3: Cyrillic Text Preservation**
    - **Validates: Requirements 3.2**
    - Create generator for strings with Cyrillic characters (Unicode 0x0400-0x04FF)
    - Test that Cyrillic text is preserved through parsing and formatting
    - Verify no encoding corruption occurs
    - _Requirements: 3.2_

  - [ ]* 9.5 Write property test for parser error reporting
    - **Property 4: Parser Reports Missing Required Fields**
    - **Validates: Requirements 3.5**
    - Generate HTML documents missing various required fields
    - Test that parser returns error identifying which field is missing
    - Verify error messages are descriptive
    - _Requirements: 3.5_

  - [ ]* 9.6 Write unit tests for parsers
    - Test search parser with sample HTML fixtures
    - Test profile parser with complete and incomplete profiles
    - Test handling of missing optional fields
    - Test HTML structure validation
    - _Requirements: 3.1, 3.4_

- [ ] 10. Implement data formatter
  - [ ] 10.1 Create data formatter class
    - Create DataFormatter class in src/formatter/data-formatter.ts
    - Implement formatSearchResults() to convert LawyerSearchResult[] to JSON string
    - Implement formatLawyerProfile() to convert LawyerProfile to JSON string
    - Implement formatError() to format MCPError with context
    - Include metadata in all responses (timestamp, source, cached flag)
    - Properly escape special characters for JSON
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 10.2 Write property test for JSON round-trip
    - **Property 5: JSON Serialization Round-Trip**
    - **Validates: Requirements 4.5, 4.3**
    - Use LawyerProfile generator with special characters and Cyrillic text
    - Test that serialize → deserialize produces equivalent object
    - Verify all fields are preserved including special characters
    - _Requirements: 4.5, 4.3_

  - [ ]* 10.3 Write unit tests for data formatter
    - Test JSON formatting with various data structures
    - Test metadata inclusion
    - Test error formatting with context
    - Test special character escaping
    - _Requirements: 4.1, 4.3, 4.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement MCP tools
  - [ ] 12.1 Implement search_lawyers tool
    - Create search-lawyers.ts in src/tools/
    - Define tool schema with inputSchema (city, specialization, name parameters)
    - Implement tool handler function
    - Validate input parameters (return error for invalid params)
    - Construct search URL with query parameters
    - Use HTTP client to fetch search results page
    - Parse HTML with search results parser
    - Format results with data formatter
    - Handle errors and return formatted error responses
    - Log request with parameters and execution time
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.4, 9.1_

  - [ ] 12.2 Implement get_lawyer_profile tool
    - Create get-profile.ts in src/tools/
    - Define tool schema with inputSchema (profileUrl required parameter)
    - Implement tool handler function
    - Validate profileUrl format (must be valid Harant URL)
    - Check cache for existing profile data
    - If cache miss or expired, fetch profile page with HTTP client
    - Parse HTML with profile parser
    - Format profile with data formatter
    - Store result in cache with 24-hour TTL
    - Handle 404 errors specifically (NOT_FOUND_ERROR)
    - Handle errors and return formatted error responses
    - Log request with URL, cache status, and execution time
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.4, 7.1, 9.2_

  - [ ]* 12.3 Write integration tests for MCP tools
    - Test search_lawyers with various parameter combinations
    - Test get_lawyer_profile with valid and invalid URLs
    - Test cache behavior (hit and miss scenarios)
    - Test error handling for network failures
    - Use recorded HTTP responses for deterministic tests
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 7.1_

- [ ] 13. Implement MCP server core
  - [ ] 13.1 Create MCP server class
    - Create server.ts in src/
    - Implement MCPServer class using @modelcontextprotocol/sdk
    - Implement initialize() method to load config and set up components
    - Implement registerTools() method to register search_lawyers and get_lawyer_profile
    - Implement handleToolCall() to route tool calls to appropriate handlers
    - Implement shutdown() method for graceful cleanup
    - Set up stdio transport for MCP communication
    - Handle MCP protocol methods: initialize, tools/list, tools/call
    - Format all responses according to MCP specification
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 13.2 Create entry point
    - Create index.ts in src/
    - Initialize configuration manager
    - Initialize logger
    - Initialize HTTP client with config
    - Initialize cache manager with config
    - Initialize MCP server
    - Register tools
    - Start server
    - Handle process signals for graceful shutdown (SIGINT, SIGTERM)
    - Log startup success and configuration summary
    - _Requirements: 5.1, 8.1, 9.1_

  - [ ]* 13.3 Write integration tests for MCP server
    - Test MCP protocol compliance (initialize, tools/list, tools/call)
    - Test tool registration and discovery
    - Test error responses in MCP format
    - Use MCP test utilities if available
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 14. Implement error handling and logging
  - [ ] 14.1 Add comprehensive error handling
    - Ensure all error types are properly categorized (NETWORK_ERROR, TIMEOUT_ERROR, PARSE_ERROR, VALIDATION_ERROR, NOT_FOUND_ERROR, CONFIG_ERROR, CACHE_ERROR)
    - Add error context (operation, url, timestamp) to all errors
    - Implement graceful degradation (server continues after non-critical errors)
    - Log all errors with appropriate severity levels
    - Include stack traces for unexpected errors
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [ ] 14.2 Add performance logging
    - Log all incoming requests with timestamps and parameters
    - Log execution time for each request
    - Log warning for requests taking longer than 5 seconds
    - Log cache statistics periodically
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 14.3 Write unit tests for error handling
    - Test error categorization and formatting
    - Test error context inclusion
    - Test graceful degradation behavior
    - Test performance logging thresholds
    - _Requirements: 6.4, 6.5, 9.3_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Create configuration and documentation files
  - [ ] 16.1 Create default configuration file
    - Create config/default.json with default values
    - Include all configuration sections with sensible defaults
    - Add comments explaining each configuration option
    - _Requirements: 8.1, 8.3_

  - [ ] 16.2 Create package.json scripts
    - Add build script (tsc)
    - Add test script (vitest)
    - Add test:property script for property-based tests
    - Add start script (node dist/index.js)
    - Add dev script with watch mode
    - _Requirements: 5.1_

  - [ ] 16.3 Create README.md
    - Document installation instructions
    - Document configuration options
    - Document MCP client setup (Claude Desktop, Cline)
    - Include usage examples
    - Document available tools and their parameters
    - Include troubleshooting section
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 17. Final integration and testing
  - [ ] 17.1 Build and test complete application
    - Run TypeScript compiler and fix any compilation errors
    - Run all unit tests and ensure they pass
    - Run all property-based tests and ensure they pass
    - Test with actual Harant portal (verify HTML selectors)
    - Update selectors if portal structure differs from assumptions
    - _Requirements: 3.1, 3.3_

  - [ ]* 17.2 Test MCP client integration
    - Test with Claude Desktop or MCP Inspector tool
    - Verify stdio transport works correctly
    - Test both tools (search_lawyers, get_lawyer_profile) end-to-end
    - Verify JSON-RPC 2.0 compliance
    - Test error scenarios from AI model perspective
    - _Requirements: 5.1, 5.4, 10.1, 10.2, 10.3_

  - [ ] 17.3 Performance and reliability testing
    - Test cache hit rate with repeated requests
    - Test retry logic with simulated network failures
    - Test timeout behavior with slow responses
    - Verify log rotation works correctly
    - Test graceful shutdown
    - _Requirements: 6.2, 6.3, 7.5, 9.1_

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests verify component interactions and external dependencies
- The implementation uses TypeScript for type safety and Node.js for runtime
- HTML selectors in parsers are examples and must be verified/updated based on actual Harant portal structure
- All Cyrillic text handling must be tested thoroughly to ensure proper encoding
- Cache and retry logic are critical for reliability and performance

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "5.1"] },
    { "id": 5, "tasks": ["5.2", "6.1"] },
    { "id": 6, "tasks": ["6.2", "7.1"] },
    { "id": 7, "tasks": ["6.3", "7.2", "7.3"] },
    { "id": 8, "tasks": ["9.1", "9.2", "9.3"] },
    { "id": 9, "tasks": ["9.4", "9.5", "9.6", "10.1"] },
    { "id": 10, "tasks": ["10.2", "10.3"] },
    { "id": 11, "tasks": ["12.1", "12.2"] },
    { "id": 12, "tasks": ["12.3", "13.1"] },
    { "id": 13, "tasks": ["13.2"] },
    { "id": 14, "tasks": ["13.3", "14.1"] },
    { "id": 15, "tasks": ["14.2"] },
    { "id": 16, "tasks": ["14.3", "16.1", "16.2", "16.3"] },
    { "id": 17, "tasks": ["17.1"] },
    { "id": 18, "tasks": ["17.2", "17.3"] }
  ]
}
```
