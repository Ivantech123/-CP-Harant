// Integration test to verify schema works with default config file
// Validates: Requirements 8.2, 8.5

import { describe, test, expect } from 'vitest';
import { ServerConfigSchema } from '../../src/config/schema';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('ServerConfigSchema with default.json', () => {
  test('should validate default.json configuration', () => {
    const configPath = join(process.cwd(), 'config', 'default.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    const result = ServerConfigSchema.safeParse(config);
    
    if (!result.success) {
      console.error('Validation errors:', result.error.issues);
    }
    
    expect(result.success).toBe(true);
  });
});
