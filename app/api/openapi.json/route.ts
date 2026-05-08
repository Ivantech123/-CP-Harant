import { NextResponse } from 'next/server';

export async function GET() {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Harant Lawyers API',
      description: 'Поиск юристов и адвокатов на портале Harant.ru',
      version: '1.0.0',
    },
    servers: [
      { url: 'https://cp-harant.vercel.app' }
    ],
    paths: {
      '/api/search-lawyers': {
        get: {
          operationId: 'searchLawyers',
          summary: 'Поиск юристов',
          description: 'Поиск юристов на портале Harant по городу, специализации или имени',
          parameters: [
            {
              name: 'city',
              in: 'query',
              required: false,
              description: 'Город (например: Москва, Санкт-Петербург)',
              schema: { type: 'string' }
            },
            {
              name: 'specialization',
              in: 'query',
              required: false,
              description: 'Специализация (например: уголовное право, семейное право)',
              schema: { type: 'string' }
            },
            {
              name: 'name',
              in: 'query',
              required: false,
              description: 'Имя или фамилия юриста',
              schema: { type: 'string' }
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              description: 'Максимум результатов, от 1 до 25',
              schema: { type: 'integer', minimum: 1, maximum: 25 }
            },
            {
              name: 'page',
              in: 'query',
              required: false,
              description: 'Номер страницы Harant',
              schema: { type: 'integer', minimum: 1 }
            }
          ],
          responses: {
            '200': {
              description: 'Список найденных юристов',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      results: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            city: { type: 'string' },
                            specialization: { type: 'string' },
                            profileUrl: { type: 'string' },
                            rating: { type: 'number' }
                          }
                        }
                      },
                      total: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/lawyer-profile': {
        get: {
          operationId: 'getLawyerProfile',
          summary: 'Профиль юриста',
          description: 'Получение детального профиля юриста по URL с портала Harant',
          parameters: [
            {
              name: 'profileUrl',
              in: 'query',
              required: true,
              description: 'URL профиля юриста на harant.ru',
              schema: { type: 'string', format: 'uri' }
            }
          ],
          responses: {
            '200': {
              description: 'Профиль юриста',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      profile: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          city: { type: 'string' },
                          specialization: { type: 'array', items: { type: 'string' } },
                          experience: { type: 'string' },
                          contacts: {
                            type: 'object',
                            properties: {
                              phone: { type: 'string' },
                              email: { type: 'string' }
                            }
                          },
                          rating: { type: 'number' },
                          description: { type: 'string' },
                          profileUrl: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/mcp': {
        get: {
          operationId: 'mcpStream',
          summary: 'MCP Streamable HTTP endpoint',
          description: 'Endpoint для MCP клиентов. Поддерживает Streamable HTTP через GET/POST/DELETE.'
        },
        post: {
          operationId: 'mcpPost',
          summary: 'MCP JSON-RPC POST',
          description: 'Основной endpoint для initialize, tools/list и tools/call.'
        }
      },
      '/api/health': {
        get: {
          operationId: 'healthCheck',
          summary: 'Проверка доступности',
          description: 'Проверяет, может ли Vercel runtime достучаться до Harant.ru',
          responses: {
            '200': { description: 'Harant доступен' },
            '503': { description: 'Harant недоступен или вернул ошибку' }
          }
        }
      }
    }
  };

  return NextResponse.json(spec);
}
