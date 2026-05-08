import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import {
  getHealth,
  getLawyerProfile,
  getSpecializationGuide,
  searchLawyers,
} from '@/src/harant/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'search_lawyers',
      {
        title: 'Search Harant lawyers',
        description:
          'Search Harant.ru lawyers by city, legal specialization, lawyer name, or a mix of these criteria.',
        inputSchema: {
          city: z.string().min(1).optional().describe('City name, for example Moskva, Москва, Saransk.'),
          specialization: z
            .string()
            .min(1)
            .optional()
            .describe('Legal specialization or user problem, for example divorce, ДТП, bankruptcy.'),
          name: z.string().min(1).optional().describe('Lawyer first name, last name, or full name.'),
          limit: z.number().int().min(1).max(25).optional().describe('Maximum results to return.'),
          page: z.number().int().min(1).optional().describe('Harant search page number.'),
        },
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
        },
      },
      async (args) => asJsonToolResult(await searchLawyers(args))
    );

    server.registerTool(
      'get_lawyer_profile',
      {
        title: 'Get Harant lawyer profile',
        description:
          'Fetch and parse a detailed Harant.ru lawyer profile from its public profile URL.',
        inputSchema: {
          profileUrl: z
            .string()
            .url()
            .describe('Full Harant lawyer profile URL, for example https://harant.ru/lawyers/moskva/name/.'),
        },
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
        },
      },
      async (args) => asJsonToolResult(await getLawyerProfile(args))
    );

    server.registerTool(
      'get_specialization_guide',
      {
        title: 'Get specialization guide',
        description:
          'Return supported Harant legal specializations, common aliases, and canonical URLs.',
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          openWorldHint: false,
        },
      },
      async () =>
        asJsonToolResult({
          specializations: getSpecializationGuide(),
          usage:
            'Use aliases to convert natural user problems into a search_lawyers specialization.',
        })
    );

    server.registerTool(
      'health_check',
      {
        title: 'Harant MCP health check',
        description: 'Check whether the MCP server can reach Harant.ru from the current Vercel runtime.',
        inputSchema: {},
        annotations: {
          readOnlyHint: true,
          openWorldHint: true,
        },
      },
      async () => asJsonToolResult(await getHealth())
    );

    server.registerResource(
      'harant-service-guide',
      'harant://service-guide',
      {
        title: 'Harant MCP service guide',
        description: 'Human-readable tool guide for AI clients.',
        mimeType: 'text/markdown',
      },
      async (uri) => ({
        contents: [
          {
            uri: uri.toString(),
            mimeType: 'text/markdown',
            text: [
              '# Harant MCP Server',
              '',
              'Tools:',
              '- search_lawyers: search by city, specialization, name, limit, page.',
              '- get_lawyer_profile: parse a public Harant lawyer profile URL.',
              '- get_specialization_guide: map natural language problems to Harant specializations.',
              '- health_check: verify Harant reachability from the server runtime.',
              '',
              'Best flow: use search_lawyers first, then call get_lawyer_profile for shortlisted lawyers.',
            ].join('\n'),
          },
        ],
      })
    );

    server.registerPrompt(
      'find_lawyer_brief',
      {
        title: 'Find lawyer brief',
        description: 'Turn a user legal problem into a focused Harant lawyer search plan.',
        argsSchema: {
          legalIssue: z.string().min(1).describe('User legal issue in natural language.'),
          city: z.string().min(1).optional().describe('Preferred city.'),
          constraints: z.string().min(1).optional().describe('Budget, rating, experience, or contact constraints.'),
        },
      },
      async ({ legalIssue, city, constraints }) => ({
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: [
                'Find suitable lawyers on Harant.ru.',
                `Issue: ${legalIssue}`,
                city ? `City: ${city}` : undefined,
                constraints ? `Constraints: ${constraints}` : undefined,
                'Use get_specialization_guide if the specialization is ambiguous, then search_lawyers, then get_lawyer_profile for the best candidates.',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          },
        ],
      })
    );
  },
  {
    serverInfo: {
      name: 'harant-mcp-server',
      version: '1.0.0',
    },
  },
  {
    basePath: '/api',
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV !== 'production',
  }
);

function asJsonToolResult(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
    structuredContent: data as Record<string, unknown>,
  };
}

export { handler as DELETE, handler as GET, handler as POST };
