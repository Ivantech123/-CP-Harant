export default function Home() {
  const mcpUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/api/mcp`
    : 'http://localhost:3000/api/mcp';

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 700, margin: '60px auto', padding: '0 20px' }}>
      <h1>⚖️ Harant MCP Server</h1>
      <p style={{ color: '#666' }}>MCP сервер для поиска юристов на портале <a href="https://harant.ru">harant.ru</a></p>

      <div style={{ background: '#f0f9ff', border: '1px solid #0ea5e9', borderRadius: 8, padding: 20, margin: '24px 0' }}>
        <h2 style={{ margin: '0 0 12px' }}>🔗 Ваш MCP URL</h2>
        <code style={{ background: '#fff', padding: '8px 12px', borderRadius: 4, display: 'block', fontSize: 14, wordBreak: 'break-all' }}>
          {mcpUrl}
        </code>
      </div>

      <h2>📋 Как подключить</h2>

      <h3>Gemini / Google AI Studio</h3>
      <p>Settings → MCP Servers → Add Server → вставьте URL выше</p>

      <h3>Claude Desktop</h3>
      <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13 }}>{`{
  "mcpServers": {
    "harant": {
      "url": "${mcpUrl}"
    }
  }
}`}</pre>

      <h3>Cursor</h3>
      <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13 }}>{`{
  "mcpServers": {
    "harant": {
      "url": "${mcpUrl}"
    }
  }
}`}</pre>

      <h2>🛠️ Доступные инструменты</h2>
      <ul>
        <li><strong>search_lawyers</strong> — поиск юристов по городу, специализации, имени</li>
        <li><strong>get_lawyer_profile</strong> — детальный профиль юриста по URL</li>
      </ul>

      <h2>💬 Примеры запросов</h2>
      <ul>
        <li>«Найди юристов в Москве»</li>
        <li>«Покажи юристов по уголовному праву»</li>
        <li>«Получи профиль юриста https://harant.ru/...»</li>
      </ul>
    </main>
  );
}
