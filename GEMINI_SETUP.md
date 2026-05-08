# 🚀 Настройка Harant MCP Server для Gemini

Подробная инструкция по настройке и использованию Harant MCP Server с Google Gemini.

## 📋 Предварительные требования

- Node.js >= 18.0.0 ([скачать](https://nodejs.org/))
- npm >= 9.0.0 (устанавливается вместе с Node.js)
- Git ([скачать](https://git-scm.com/))
- Аккаунт Google для доступа к Gemini

## 🔧 Шаг 1: Установка проекта

### 1.1 Клонирование репозитория

```bash
# Клонируйте репозиторий
git clone https://github.com/Ivantech123/-CP-Harant.git

# Перейдите в директорию проекта
cd -CP-Harant
```

### 1.2 Установка зависимостей

```bash
# Установите все необходимые пакеты
npm install
```

### 1.3 Сборка проекта

```bash
# Соберите TypeScript код в JavaScript
npm run build
```

После успешной сборки в папке `dist/` появятся скомпилированные файлы.

## 🎯 Шаг 2: Настройка для Gemini

### 2.1 Проверка конфигурации MCP

В корне проекта уже создан файл `.mcp-config.json`:

```json
{
  "mcpServers": {
    "harant-mcp-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### 2.2 Настройка в Google AI Studio / Gemini

#### Вариант A: Через Google AI Studio (веб-интерфейс)

1. Откройте [Google AI Studio](https://aistudio.google.com/)
2. Войдите в свой аккаунт Google
3. Перейдите в раздел **Settings** (Настройки)
4. Найдите секцию **MCP Servers** или **Extensions**
5. Нажмите **Add Server** (Добавить сервер)
6. Заполните поля:
   - **Name**: `Harant Lawyer Search`
   - **Command**: `node`
   - **Arguments**: `["C:\\Users\\Иван\\Desktop\\mcp harant\\dist\\index.js"]`
   - **Working Directory**: `C:\Users\Иван\Desktop\mcp harant`
7. Сохраните настройки

#### Вариант B: Через конфигурационный файл Gemini

Если у вас установлен Gemini Desktop или CLI:

1. Найдите конфигурационный файл Gemini:
   - Windows: `%APPDATA%\Gemini\config.json`
   - macOS: `~/Library/Application Support/Gemini/config.json`
   - Linux: `~/.config/gemini/config.json`

2. Добавьте конфигурацию MCP сервера:

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

3. Перезапустите Gemini

## ✅ Шаг 3: Проверка работы

### 3.1 Тестирование локально

Перед подключением к Gemini убедитесь, что сервер работает:

```bash
# Запустите тесты
npm test

# Проверьте сборку
npm run build
```

### 3.2 Тестирование в Gemini

Откройте чат с Gemini и попробуйте следующие команды:

#### Пример 1: Поиск юристов по городу

```
Найди юристов в Москве
```

Gemini должен использовать инструмент `search_lawyers` с параметром `city: "Москва"`.

#### Пример 2: Поиск по специализации

```
Покажи юристов по уголовному праву
```

Gemini использует `search_lawyers` с параметром `specialization: "уголовное право"`.

#### Пример 3: Получение профиля юриста

```
Получи детальную информацию о юристе по ссылке https://harant.ru/lawyers/profile/123
```

Gemini использует `get_lawyer_profile` с параметром `profileUrl`.

## 🛠️ Шаг 4: Настройка конфигурации (опционально)

### 4.1 Редактирование config/default.json

Вы можете настроить параметры сервера в файле `config/default.json`:

```json
{
  "harant": {
    "baseUrl": "https://harant.ru",
    "searchPath": "/lawyers/search",
    "profilePath": "/lawyers/profile"
  },
  "http": {
    "timeout": 30000,
    "maxRetries": 3,
    "retryDelay": 1000
  },
  "cache": {
    "enabled": true,
    "ttl": 86400,
    "maxSize": 1000
  },
  "logging": {
    "level": "INFO",
    "file": "harant-mcp.log",
    "console": true
  }
}
```

**Основные параметры:**

- `http.timeout` - таймаут запросов в миллисекундах (по умолчанию 30 секунд)
- `http.maxRetries` - количество повторных попыток при ошибках (по умолчанию 3)
- `cache.ttl` - время жизни кэша в секундах (по умолчанию 24 часа)
- `logging.level` - уровень логирования: DEBUG, INFO, WARNING, ERROR, CRITICAL

### 4.2 Просмотр логов

Логи сервера сохраняются в файл `harant-mcp.log` в корне проекта:

```bash
# Просмотр последних логов (Windows PowerShell)
Get-Content harant-mcp.log -Tail 50

# Просмотр логов в реальном времени
Get-Content harant-mcp.log -Wait
```

## 🎨 Доступные инструменты

### 1. search_lawyers

**Описание**: Поиск юристов на портале Harant по различным критериям.

**Параметры**:
- `city` (опционально) - город для поиска (например: "Москва", "Санкт-Петербург")
- `specialization` (опционально) - специализация юриста (например: "уголовное право")
- `name` (опционально) - имя или фамилия юриста

**Пример использования в Gemini**:
```
Найди юристов по корпоративному праву в Санкт-Петербурге
```

**Ответ**:
```json
{
  "results": [
    {
      "name": "Иванов Иван Иванович",
      "city": "Санкт-Петербург",
      "specialization": "Корпоративное право",
      "profileUrl": "https://harant.ru/lawyers/profile/123",
      "rating": 4.8
    }
  ],
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "harant.ru",
    "cached": false
  }
}
```

### 2. get_lawyer_profile

**Описание**: Получение детального профиля юриста по URL.

**Параметры**:
- `profileUrl` (обязательно) - URL профиля юриста на портале Harant

**Пример использования в Gemini**:
```
Получи полную информацию о юристе https://harant.ru/lawyers/profile/123
```

**Ответ**:
```json
{
  "profile": {
    "name": "Иванов Иван Иванович",
    "city": "Москва",
    "specialization": ["Уголовное право", "Административное право"],
    "experience": "15 лет",
    "contacts": {
      "phone": "+7 (495) 123-45-67",
      "email": "ivanov@example.com"
    },
    "rating": 4.8,
    "description": "Опытный юрист с 15-летним стажем..."
  },
  "metadata": {
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "harant.ru",
    "cached": true
  }
}
```

## 🐛 Устранение неполадок

### Проблема: Gemini не видит MCP сервер

**Решение**:
1. Убедитесь, что проект собран: `npm run build`
2. Проверьте, что путь к `dist/index.js` указан правильно
3. Перезапустите Gemini
4. Проверьте логи в `harant-mcp.log`

### Проблема: Ошибка "Cannot find module"

**Решение**:
```bash
# Переустановите зависимости
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Проблема: Таймаут при запросах к Harant

**Решение**:
1. Увеличьте `http.timeout` в `config/default.json`
2. Проверьте доступность сайта https://harant.ru
3. Проверьте настройки прокси/файрвола

### Проблема: Сервер не парсит данные

**Решение**:
1. Структура HTML на сайте Harant могла измениться
2. Проверьте логи для деталей ошибки
3. Обновите CSS селекторы в парсерах (см. `src/parser/`)

## 📚 Дополнительные ресурсы

- [Документация MCP](https://modelcontextprotocol.io/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Репозиторий проекта](https://github.com/Ivantech123/-CP-Harant)
- [Портал Harant](https://harant.ru/)

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте раздел "Устранение неполадок" выше
2. Посмотрите логи в `harant-mcp.log`
3. Создайте Issue на GitHub: https://github.com/Ivantech123/-CP-Harant/issues

## 📝 Лицензия

MIT License - см. файл LICENSE в репозитории.

---

**Готово! 🎉** Теперь вы можете использовать Harant MCP Server с Gemini для поиска юристов и получения информации об их профилях.
