# Harant MCP Server

MCP Server для интеграции юридического портала Harant (https://harant.ru/) с AI моделями.

## Описание

Harant MCP Server реализует Model Context Protocol (MCP) для предоставления AI моделям доступа к информации о юристах с портала Harant. Сервер предоставляет два основных инструмента:

1. **search_lawyers** - поиск юристов по критериям (город, специализация, имя)
2. **get_lawyer_profile** - получение детального профиля юриста

## Требования

- Node.js >= 18.0.0
- npm >= 9.0.0

## Установка

```bash
npm install
```

## Разработка

```bash
# Сборка проекта
npm run build

# Режим разработки с автоматической пересборкой
npm run dev

# Запуск тестов
npm test

# Запуск тестов в режиме watch
npm run test:watch

# Проверка типов
npm run lint
```

## Структура проекта

```
harant-mcp-server/
├── src/                    # Исходный код
│   ├── index.ts           # Точка входа
│   ├── server.ts          # MCP сервер
│   ├── tools/             # Реализация MCP инструментов
│   ├── http/              # HTTP клиент
│   ├── parser/            # HTML парсеры
│   ├── cache/             # Менеджер кэша
│   ├── formatter/         # Форматирование данных
│   ├── config/            # Управление конфигурацией
│   ├── logger/            # Логирование
│   └── types/             # TypeScript типы
├── tests/                 # Тесты
│   ├── unit/             # Юнит-тесты
│   ├── property/         # Property-based тесты
│   ├── integration/      # Интеграционные тесты
│   └── fixtures/         # Тестовые данные
├── config/               # Конфигурационные файлы
└── dist/                 # Скомпилированный код

```

## Настройка для AI моделей

### Gemini (Google AI Studio)

📖 **[Подробная инструкция по настройке для Gemini](./GEMINI_SETUP.md)**

Краткая версия:

1. Соберите проект:
```bash
npm run build
```

2. Добавьте сервер в конфигурацию Gemini (см. [GEMINI_SETUP.md](./GEMINI_SETUP.md))

3. Используйте инструменты `search_lawyers` и `get_lawyer_profile` в чате с Gemini

### Claude Desktop

Добавьте в `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "harant": {
      "command": "node",
      "args": ["C:\\Users\\Иван\\Desktop\\mcp harant\\dist\\index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Cline (VS Code)

Добавьте в `.vscode/settings.json`:
```json
{
  "mcp.servers": {
    "harant": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

## Конфигурация

Конфигурация сервера находится в файле `config/default.json`. Основные параметры:

- `harant.baseUrl` - базовый URL портала Harant
- `http.timeout` - таймаут HTTP запросов (мс)
- `http.maxRetries` - максимальное количество повторных попыток
- `cache.ttl` - время жизни кэша (секунды)
- `logging.level` - уровень логирования (DEBUG, INFO, WARNING, ERROR, CRITICAL)

## Технологии

- **TypeScript** - типобезопасность
- **@modelcontextprotocol/sdk** - официальный MCP SDK
- **axios** - HTTP клиент
- **cheerio** - парсинг HTML
- **node-cache** - кэширование
- **winston** - логирование
- **zod** - валидация схем
- **vitest** - тестирование
- **fast-check** - property-based тестирование

## Лицензия

MIT
