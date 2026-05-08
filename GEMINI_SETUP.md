# Настройка Harant MCP Server для Gemini

Этот проект теперь работает как удаленный MCP-сервер через Vercel. Локальный `dist/index.js` больше не нужен.

## Вариант 1: Vercel

1. Задеплойте проект на Vercel.
2. Возьмите URL:

```text
https://your-project.vercel.app/api/mcp
```

3. Добавьте его в MCP-настройках клиента как Streamable HTTP endpoint.

Пример:

```json
{
  "mcpServers": {
    "harant": {
      "url": "https://your-project.vercel.app/api/mcp"
    }
  }
}
```

## Вариант 2: локальная разработка

```bash
npm install
npm run dev
```

Локальный MCP URL:

```text
http://localhost:3000/api/mcp
```

Для stdio-only клиентов используйте `mcp-remote`:

```json
{
  "mcpServers": {
    "harant": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:3000/api/mcp"]
    }
  }
}
```

## Инструменты

- `search_lawyers` - поиск по городу, специализации, имени, странице и лимиту.
- `get_lawyer_profile` - получение детального профиля по URL.
- `get_specialization_guide` - справочник специализаций и синонимов.
- `health_check` - проверка доступности Harant.ru из runtime.

## Проверка

```bash
npm run verify
npm audit --audit-level=moderate
```
