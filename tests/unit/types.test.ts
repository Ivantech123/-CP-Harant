import { describe, it, expect } from 'vitest';
import type { LawyerSearchResult, LawyerProfile, ContactInfo } from '../../src/types/lawyer';
import { ErrorType, type MCPError } from '../../src/types/errors';
import type { ServerConfig, LogLevel } from '../../src/types/config';

describe('Type Definitions', () => {
  describe('Lawyer Types', () => {
    it('should create valid ContactInfo object', () => {
      const contact: ContactInfo = {
        phone: '+7 (495) 123-45-67',
        email: 'test@example.com',
        website: 'https://example.com',
        telegram: '@testuser'
      };
      
      expect(contact.phone).toBe('+7 (495) 123-45-67');
      expect(contact.email).toBe('test@example.com');
    });

    it('should create valid LawyerSearchResult object', () => {
      const result: LawyerSearchResult = {
        name: 'Иванов Иван Иванович',
        city: 'Москва',
        specialization: 'Уголовное право',
        profileUrl: 'https://harant.ru/lawyers/profile/123',
        rating: 4.8
      };
      
      expect(result.name).toBe('Иванов Иван Иванович');
      expect(result.city).toBe('Москва');
      expect(result.rating).toBe(4.8);
    });

    it('should create valid LawyerProfile object with all required fields', () => {
      const profile: LawyerProfile = {
        name: 'Иванов Иван Иванович',
        city: 'Москва',
        specialization: ['Уголовное право', 'Административное право'],
        experience: '15 лет',
        contacts: {
          phone: '+7 (495) 123-45-67',
          email: 'ivanov@example.com'
        },
        rating: 4.8,
        description: 'Опытный юрист',
        education: ['МГУ'],
        languages: ['Русский', 'Английский'],
        achievements: ['Победитель конкурса']
      };
      
      expect(profile.name).toBe('Иванов Иван Иванович');
      expect(profile.specialization).toHaveLength(2);
      expect(profile.contacts.phone).toBe('+7 (495) 123-45-67');
    });

    it('should allow LawyerProfile with only required fields', () => {
      const profile: LawyerProfile = {
        name: 'Петров Петр',
        city: 'Санкт-Петербург',
        specialization: ['Корпоративное право'],
        experience: '5 лет',
        contacts: {}
      };
      
      expect(profile.name).toBe('Петров Петр');
      expect(profile.rating).toBeUndefined();
      expect(profile.description).toBeUndefined();
    });
  });

  describe('Error Types', () => {
    it('should have all error type enum values', () => {
      expect(ErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorType.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
      expect(ErrorType.PARSE_ERROR).toBe('PARSE_ERROR');
      expect(ErrorType.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorType.NOT_FOUND_ERROR).toBe('NOT_FOUND_ERROR');
      expect(ErrorType.CONFIG_ERROR).toBe('CONFIG_ERROR');
      expect(ErrorType.CACHE_ERROR).toBe('CACHE_ERROR');
    });

    it('should create valid MCPError object', () => {
      const error: MCPError = {
        type: ErrorType.NETWORK_ERROR,
        message: 'Не удалось подключиться к порталу',
        details: 'Connection refused',
        timestamp: new Date(),
        retryable: true
      };
      
      expect(error.type).toBe(ErrorType.NETWORK_ERROR);
      expect(error.message).toBe('Не удалось подключиться к порталу');
      expect(error.retryable).toBe(true);
    });

    it('should allow MCPError without optional fields', () => {
      const error: MCPError = {
        type: ErrorType.VALIDATION_ERROR,
        message: 'Некорректный формат URL',
        timestamp: new Date(),
        retryable: false
      };
      
      expect(error.details).toBeUndefined();
    });
  });

  describe('Config Types', () => {
    it('should accept valid LogLevel values', () => {
      const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
      
      levels.forEach(level => {
        const config: ServerConfig = {
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
            level: level,
            file: 'harant-mcp.log',
            console: true
          }
        };
        
        expect(config.logging.level).toBe(level);
      });
    });

    it('should create valid ServerConfig object', () => {
      const config: ServerConfig = {
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
      
      expect(config.harant.baseUrl).toBe('https://harant.ru');
      expect(config.http.timeout).toBe(30000);
      expect(config.cache.enabled).toBe(true);
      expect(config.logging.level).toBe('INFO');
    });
  });
});
