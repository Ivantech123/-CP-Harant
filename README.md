# ⚖️ Harant MCP Server

MCP сервер для поиска юристов на [harant.ru](https://harant.ru) — работает через Vercel, никакой установки.

## 🚀 Деплой на Vercel (1 минута)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Ivantech123/-CP-Harant)

1. Нажмите кнопку выше
2. Войдите в Vercel (или зарегистрируйтесь)
3. Нажмите **Deploy**
4. Получите URL вида `https://ваш-проект.vercel.app/api/mcp`

## 🔗 Подключение к AI

После деплоя вставьте URL в настройки:

### Gemini / Google AI Studio
Settings → MCP Servers → Add → вставьте URL

### Claude Desktop
```json
{
  "mcpServers": {
    "harant": {
      "url": "https://ваш-проект.vercel.app/api/mcp"
    }
  }
}
```

### Cursor
```json
{
  "mcpServers": {
    "harant": {
      "url": "https://ваш-проект.vercel.app/api/mcp"
    }
  }
}
```

## �️ Инструменты

- **search_lawyers** — поиск по городу, специализации, имени
- **get_lawyer_profile** — детальный профиль по URL

## 💬 Примеры

- «Найди юристов в Москве»
- «Покажи юристов по уголовному праву»
- «Получи профиль https://harant.ru/lawyers/...»
