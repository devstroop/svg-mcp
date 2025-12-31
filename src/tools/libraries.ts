import { ProviderRegistry } from '../providers/registry.js';

/**
 * List all available icon libraries with detailed information
 * This tool helps assistants understand what icon sources are available
 */
export async function listLibraries() {
  try {
    const registry = ProviderRegistry.getInstance();
    const libraries = registry.getLibraryInfo();
    const popularSets = registry.getPopularIconSets();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          recommended: {
            library: 'iconify',
            reason: 'Access to 200,000+ icons from 150+ icon sets through a unified API. Use format "prefix:name" (e.g., "mdi:home").'
          },
          libraries,
          popularIconSets: popularSets,
          usage: {
            searchExample: {
              tool: 'search_icons',
              args: { query: 'home', libraries: ['iconify'], limit: 10 }
            },
            getIconExample: {
              tool: 'get_icon',
              args: { name: 'mdi:home', library: 'iconify', size: 24, color: '#000000' }
            },
            brandIconsExample: {
              tool: 'get_icon', 
              args: { name: 'simple-icons:github', library: 'iconify' }
            }
          },
          tips: [
            'Use "iconify" library for the best icon coverage',
            'For brand/logo icons, use "simple-icons:brandname" (e.g., "simple-icons:github")',
            'For UI icons, try "lucide:", "heroicons:", or "mdi:" prefixes',
            'Search without prefix to find icons across all 150+ icon sets'
          ]
        }, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(`Failed to list libraries: ${error instanceof Error ? error.message : String(error)}`);
  }
}
