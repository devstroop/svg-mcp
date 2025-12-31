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
import { optimizeSvg } from './tools/optimize.js';
import { listLibraries } from './tools/libraries.js';
import { recommendIcons } from './tools/recommend.js';
import { getMultipleIcons } from './tools/batch.js';

class IconsMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'svg-mcp',
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
          // Primary tools for assistants
          {
            name: 'list_libraries',
            description: 'List all available icon libraries with details. START HERE to understand available icon sources. Returns library info, popular icon sets (mdi, lucide, heroicons, etc.), and usage examples.',
            inputSchema: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'recommend_icons',
            description: 'Get AI-friendly icon recommendations for common UI use cases. Supports: navigation, sidebar, user, authentication, ecommerce, payment, files, media, status, settings, dashboard, development, brands, weather, calendar, search, communication, social, actions, crud. Returns curated icon suggestions with usage examples.',
            inputSchema: {
              type: 'object',
              properties: {
                useCase: {
                  type: 'string',
                  description: 'The UI use case (e.g., "navigation", "ecommerce", "user", "status", "settings", "brands")'
                },
                style: {
                  type: 'string',
                  enum: ['outline', 'solid', 'filled', 'any'],
                  default: 'any',
                  description: 'Preferred icon style'
                },
                limit: {
                  type: 'number',
                  default: 10,
                  description: 'Maximum number of recommendations'
                }
              },
              required: ['useCase']
            }
          },
          {
            name: 'search_icons',
            description: 'Search for icons across 200,000+ icons from 150+ icon sets. Use "iconify" library (default) for best results. Icons are returned in "prefix:name" format (e.g., "mdi:home", "lucide:settings").',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (e.g., "home", "settings", "arrow")'
                },
                libraries: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Libraries to search. Use ["iconify"] for all icons, or specific: ["fontawesome", "material", "heroicons"]',
                  default: ['iconify']
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
            description: 'Get a specific icon by name. For Iconify, use "prefix:name" format (e.g., "mdi:home", "lucide:settings", "simple-icons:github"). Returns SVG content ready for use.',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Icon name. For iconify: "prefix:name" (e.g., "mdi:home", "lucide:user", "heroicons:cog-6-tooth")',
                },
                library: {
                  type: 'string',
                  description: 'Icon library. Use "iconify" (recommended) or legacy: "fontawesome", "material", "heroicons"',
                  default: 'iconify'
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
                  description: 'Icon color as hex (e.g., "#ff0000", "#000000")',
                },
                optimize: {
                  type: 'boolean',
                  description: 'Enable SVG optimization to reduce file size',
                  default: false,
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'get_multiple_icons',
            description: 'Fetch multiple icons in a single request. Efficient for getting several icons at once. Maximum 50 icons per request.',
            inputSchema: {
              type: 'object',
              properties: {
                icons: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Icon name (e.g., "mdi:home" for iconify)' },
                      library: { type: 'string', default: 'iconify' },
                      size: { type: 'number', default: 24 },
                      color: { type: 'string' }
                    },
                    required: ['name']
                  },
                  description: 'Array of icon requests'
                },
                optimize: {
                  type: 'boolean',
                  default: false,
                  description: 'Optimize all SVGs'
                },
                format: {
                  type: 'string',
                  enum: ['svg', 'png'],
                  default: 'svg'
                }
              },
              required: ['icons']
            }
          },
          {
            name: 'list_categories',
            description: 'Get available icon categories/styles from a library (e.g., solid, outline, brands)',
            inputSchema: {
              type: 'object',
              properties: {
                library: {
                  type: 'string',
                  description: 'Icon library name (iconify, fontawesome, material, heroicons)',
                },
              },
              required: ['library'],
            },
          },
          {
            name: 'convert_icon',
            description: 'Convert SVG icon to PNG format using Sharp. Supports custom sizes.',
            inputSchema: {
              type: 'object',
              properties: {
                iconData: {
                  type: 'string',
                  description: 'SVG content to convert',
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
                  description: 'Output size in pixels (width and height)',
                  default: 64,
                },
              },
              required: ['iconData', 'fromFormat', 'toFormat'],
            },
          },
          {
            name: 'create_sprite',
            description: 'Generate an SVG sprite sheet combining multiple icons. Useful for web apps that need multiple icons.',
            inputSchema: {
              type: 'object',
              properties: {
                icons: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of icon names to include in sprite',
                },
                library: {
                  type: 'string',
                  description: 'Icon library to use',
                },
                format: {
                  type: 'string',
                  enum: ['svg', 'png'],
                  default: 'svg',
                },
                optimize: {
                  type: 'boolean',
                  description: 'Optimize the sprite SVG',
                  default: false,
                },
              },
              required: ['icons', 'library'],
            },
          },
          {
            name: 'optimize_svg',
            description: 'Clean and optimize SVG content using SVGO. Removes metadata, comments, and unnecessary attributes to reduce file size.',
            inputSchema: {
              type: 'object',
              properties: {
                svgContent: {
                  type: 'string',
                  description: 'SVG content to optimize',
                },
                options: {
                  type: 'object',
                  description: 'Optimization options (all default to sensible values)',
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
          case 'list_libraries':
            return await listLibraries();

          case 'recommend_icons':
            return await recommendIcons(args);

          case 'search_icons':
            return await searchIcons(args);

          case 'get_icon':
            return await getIcon(args);

          case 'get_multiple_icons':
            return await getMultipleIcons(args);

          case 'list_categories':
            return await listCategories(args);

          case 'convert_icon':
            return await convertIcon(args);

          case 'create_sprite':
            return await createSprite(args);

          case 'optimize_svg':
            return await optimizeSvg(args);

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
    console.error('svg-mcp v1.0.0 running on stdio');
  }
}

const server = new IconsMcpServer();
server.run().catch(console.error);
