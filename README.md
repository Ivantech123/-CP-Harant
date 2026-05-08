# Harant MCP Server

Production-ready MCP server for searching public lawyer profiles on [harant.ru](https://harant.ru). It runs as a Next.js App Router application and is ready for Vercel.

## What It Provides

- `POST /api/mcp` - Streamable HTTP MCP endpoint for AI clients.
- `GET /api/search-lawyers` - plain JSON search API for debugging and non-MCP clients.
- `GET /api/lawyer-profile` - plain JSON profile parser.
- `GET /api/health` - runtime health check for Vercel.
- `GET /api/openapi.json` - OpenAPI description for the JSON API.

## MCP Tools

- `search_lawyers` - search by city, specialization, name, page, and limit.
- `get_lawyer_profile` - fetch a detailed profile from a Harant profile URL.
- `get_specialization_guide` - map natural language legal problems to Harant categories.
- `health_check` - verify Harant reachability from the deployed runtime.

The server also exposes `harant://service-guide` as an MCP resource and `find_lawyer_brief` as an MCP prompt.

## Deploy To Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Ivantech123/-CP-Harant)

After deploy, use:

```text
https://your-project.vercel.app/api/mcp
```

No environment variables are required.

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
http://localhost:3000/api/mcp
```

## Client Examples

Streamable HTTP clients:

```json
{
  "mcpServers": {
    "harant": {
      "url": "https://your-project.vercel.app/api/mcp"
    }
  }
}
```

Stdio-only clients can use `mcp-remote`:

```json
{
  "mcpServers": {
    "harant": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://your-project.vercel.app/api/mcp"]
    }
  }
}
```

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Or run all checks:

```bash
npm run verify
```
