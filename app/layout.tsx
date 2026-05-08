export const metadata = {
  title: 'Harant MCP Server',
  description: 'MCP сервер для поиска юристов на портале harant.ru',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
