import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { searchIcons } from './tools/search.js';
import { getIcon } from './tools/retrieve.js';
import { listCategories } from './tools/categories.js';
import { convertIcon } from './tools/convert.js';
import { createSprite } from './tools/sprite.js';
// import { optimizeSvg } from './tools/optimize.js';

class IconsMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'icones-mcp',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'search_icons',
            description: 'Search for icons across multiple libraries',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for icons',
                },
                libraries: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Icon libraries to search in',
                  default: ['fontawesome', 'material'],
                },
                limit: {
                  type: 'number',
                  description: 'Maximum number of results',
                  default: 20,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'get_icon',
            description: 'Retrieve a specific icon in the desired format',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Icon name',
                },
                library: {
                  type: 'string',
                  description: 'Icon library',
                },
                format: {
                  type: 'string',
                  enum: ['svg', 'png'],
                  default: 'svg',
                },
                size: {
                  type: 'number',
                  description: 'Icon size in pixels',
                  default: 24,
                },
                color: {
                  type: 'string',
                  description: 'Icon color (for SVG)',
                  default: '#000000',
                },
                optimize: {
                  type: 'boolean',
                  description: 'Enable SVG optimization',
                  default: false,
                },
              },
              required: ['name', 'library'],
            },
          },
          {
            name: 'list_categories',
            description: 'Get available icon categories from a library',
            inputSchema: {
              type: 'object',
              properties: {
                library: {
                  type: 'string',
                  description: 'Icon library name',
                },
              },
              required: ['library'],
            },
          },
          {
            name: 'convert_icon',
            description: 'Convert an icon between different formats',
            inputSchema: {
              type: 'object',
              properties: {
                iconData: {
                  type: 'string',
                  description: 'Icon data (SVG string or base64)',
                },
                fromFormat: {
                  type: 'string',
                  enum: ['svg', 'png'],
                },
                toFormat: {
                  type: 'string',
                  enum: ['svg', 'png'],
                },
                size: {
                  type: 'number',
                  description: 'Output size in pixels',
                  default: 64,
                },
              },
              required: ['iconData', 'fromFormat', 'toFormat'],
            },
          },
          {
            name: 'create_sprite',
            description: 'Generate an icon sprite sheet',
            inputSchema: {
              type: 'object',
              properties: {
                icons: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of icon names',
                },
                library: {
                  type: 'string',
                  description: 'Icon library',
                },
                format: {
                  type: 'string',
                  enum: ['svg', 'png'],
                  default: 'svg',
                },
                optimize: {
                  type: 'boolean',
                  description: 'Optimize the sprite',
                  default: false,
                },
              },
              required: ['icons', 'library'],
            },
          },
          {
            name: 'optimize_svg',
            description: 'Clean and optimize SVG files',
            inputSchema: {
              type: 'object',
              properties: {
                svgContent: {
                  type: 'string',
                  description: 'SVG content to optimize',
                },
                options: {
                  type: 'object',
                  description: 'Optimization options',
                  properties: {
                    removeMetadata: { type: 'boolean', default: true },
                    removeComments: { type: 'boolean', default: true },
                    removeDimensions: { type: 'boolean', default: false },
                    removeViewBox: { type: 'boolean', default: false },
                    removeStyleElements: { type: 'boolean', default: true },
                    removeScriptElements: { type: 'boolean', default: true },
                    removeTitle: { type: 'boolean', default: false },
                    removeDesc: { type: 'boolean', default: false },
                    removeUselessDefs: { type: 'boolean', default: true },
                    removeEditorsNSData: { type: 'boolean', default: true },
                    removeEmptyAttrs: { type: 'boolean', default: true },
                    removeHiddenElems: { type: 'boolean', default: true },
                    removeEmptyText: { type: 'boolean', default: true },
                    removeEmptyContainers: { type: 'boolean', default: true },
                    cleanupIDs: { type: 'boolean', default: true },
                    minifyStyles: { type: 'boolean', default: true },
                  },
                },
              },
              required: ['svgContent'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_icons':
            return await searchIcons(args);

          case 'get_icon':
            return await getIcon(args);

          case 'list_categories':
            return await listCategories(args);

          case 'convert_icon':
            return await convertIcon(args);

          case 'create_sprite':
            return await createSprite(args);

          // case 'optimize_svg':
          //   return await optimizeSvg(args);

          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Icons MCP server running on stdio');
  }
}

const server = new IconsMcpServer();
server.run().catch(console.error);
