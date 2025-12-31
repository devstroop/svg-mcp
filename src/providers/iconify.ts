import { BaseIconProvider, IconRetrievalOptions } from './base-provider.js';
import { IconSearchResult, IconData } from '../types/index.js';

interface IconifyIconSet {
  name: string;
  total: number;
  author?: { name: string; url?: string };
  license?: { title: string; spdx?: string };
  height?: number;
  samples?: string[];
  category?: string;
}

interface IconifySearchResult {
  icons: string[];
  total: number;
  limit: number;
  start: number;
}

/**
 * Iconify Provider - Access to 200,000+ icons from 150+ icon sets
 * Uses the public Iconify API: https://iconify.design/docs/api/
 */
export class IconifyProvider extends BaseIconProvider {
  name = 'iconify';
  displayName = 'Iconify (All Icon Sets)';
  baseUrl = 'https://api.iconify.design';
  supportedFormats = ['svg', 'png'];
  requiresApiKey = false;

  private collectionsCache: Map<string, IconifyIconSet> | null = null;
  private readonly popularSets = [
    'mdi',           // Material Design Icons (7000+ icons)
    'ph',            // Phosphor Icons
    'heroicons',     // Heroicons
    'lucide',        // Lucide Icons
    'tabler',        // Tabler Icons
    'fa6-solid',     // Font Awesome 6 Solid
    'fa6-regular',   // Font Awesome 6 Regular
    'fa6-brands',    // Font Awesome 6 Brands
    'bi',            // Bootstrap Icons
    'ri',            // Remix Icons
    'carbon',        // Carbon Icons (IBM)
    'fluent',        // Fluent UI Icons (Microsoft)
    'ion',           // Ionicons
    'octicon',       // GitHub Octicons
    'simple-icons',  // Simple Icons (Brand logos)
  ];

  async search(query: string, limit = 20): Promise<IconSearchResult[]> {
    try {
      // Search across icon sets using the Iconify search API
      const searchUrl = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`Search API returned ${response.status}`);
      }

      const data = await response.json() as IconifySearchResult;
      const results: IconSearchResult[] = [];

      for (const iconId of data.icons) {
        // iconId format is "prefix:name" e.g., "mdi:home"
        const [prefix, name] = iconId.split(':');
        const collections = await this.getCollections();
        const collection = collections.get(prefix);

        results.push({
          name: iconId,
          library: 'iconify',
          tags: [prefix, name, ...(name.split('-'))],
          category: collection?.category || prefix,
          url: `https://icon-sets.iconify.design/${prefix}/${name}/`,
          preview: `${this.baseUrl}/${prefix}/${name}.svg`
        });
      }

      return results;
    } catch (error) {
      console.error('Iconify search error:', error);
      return [];
    }
  }

  async getIcon(name: string, options: IconRetrievalOptions = {}): Promise<IconData> {
    const { format = 'svg', size = 24, color } = options;

    // Parse icon ID - can be "prefix:name" or just "name" (defaults to mdi)
    let prefix: string;
    let iconName: string;
    
    if (name.includes(':')) {
      [prefix, iconName] = name.split(':');
    } else {
      prefix = 'mdi';
      iconName = name;
    }

    try {
      // Build the SVG URL with customization
      let svgUrl = `${this.baseUrl}/${prefix}/${iconName}.svg`;
      const params: string[] = [];
      
      if (size && size !== 24) {
        params.push(`height=${size}`);
      }
      if (color) {
        // Remove # from color for URL
        const cleanColor = color.replace('#', '');
        params.push(`color=%23${cleanColor}`);
      }
      
      if (params.length > 0) {
        svgUrl += '?' + params.join('&');
      }

      const response = await fetch(svgUrl);
      if (!response.ok) {
        throw new Error(`Icon not found: ${prefix}:${iconName}`);
      }

      const svgContent = await response.text();
      
      // Get collection info for metadata
      const collections = await this.getCollections();
      const collection = collections.get(prefix);

      return {
        name: `${prefix}:${iconName}`,
        library: 'iconify',
        format: 'svg',
        content: svgContent,
        size,
        color,
        metadata: {
          category: collection?.category || prefix,
          tags: [prefix, iconName, ...(iconName.split('-'))],
          license: collection?.license?.spdx || collection?.license?.title || 'Various'
        }
      };
    } catch (error) {
      throw new Error(`Failed to get Iconify icon: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCategories(): Promise<string[]> {
    const collections = await this.getCollections();
    const categories = new Set<string>();
    
    for (const collection of collections.values()) {
      if (collection.category) {
        categories.add(collection.category);
      }
    }
    
    return Array.from(categories).sort();
  }

  /**
   * Get list of available icon sets/collections
   */
  async getCollections(): Promise<Map<string, IconifyIconSet>> {
    if (this.collectionsCache) {
      return this.collectionsCache;
    }

    try {
      const response = await fetch(`${this.baseUrl}/collections`);
      if (!response.ok) {
        throw new Error(`Collections API returned ${response.status}`);
      }

      const data = await response.json() as Record<string, IconifyIconSet>;
      this.collectionsCache = new Map(Object.entries(data));
      return this.collectionsCache;
    } catch (error) {
      console.error('Failed to load Iconify collections:', error);
      return new Map();
    }
  }

  /**
   * Get icons from a specific icon set
   */
  async getIconsFromSet(prefix: string, limit = 100): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/collection?prefix=${prefix}`);
      if (!response.ok) {
        return [];
      }

      const data = await response.json() as { uncategorized?: string[]; categories?: Record<string, string[]> };
      const icons: string[] = data.uncategorized || [];
      
      // Also collect from categories if present
      if (data.categories) {
        for (const categoryIcons of Object.values(data.categories)) {
          icons.push(...categoryIcons);
        }
      }

      return icons.slice(0, limit);
    } catch {
      return [];
    }
  }

  /**
   * Get popular icon recommendations based on use case
   */
  async getRecommendations(useCase: string, limit = 10): Promise<IconSearchResult[]> {
    // Map common use cases to search terms and preferred icon sets
    const useCaseMapping: Record<string, { terms: string[]; preferredSets: string[] }> = {
      'navigation': { 
        terms: ['menu', 'home', 'arrow', 'chevron', 'back', 'forward'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'social': { 
        terms: ['share', 'like', 'comment', 'user', 'profile'],
        preferredSets: ['simple-icons', 'fa6-brands', 'mdi']
      },
      'e-commerce': { 
        terms: ['cart', 'shop', 'payment', 'credit-card', 'bag'],
        preferredSets: ['lucide', 'heroicons', 'phosphor']
      },
      'communication': { 
        terms: ['mail', 'message', 'chat', 'phone', 'notification'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'file-management': { 
        terms: ['file', 'folder', 'document', 'download', 'upload'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'media': { 
        terms: ['play', 'pause', 'video', 'music', 'image'],
        preferredSets: ['lucide', 'heroicons', 'phosphor']
      },
      'settings': { 
        terms: ['settings', 'cog', 'gear', 'preferences', 'config'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'status': { 
        terms: ['check', 'warning', 'error', 'info', 'success'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
    };

    const mapping = useCaseMapping[useCase.toLowerCase()];
    if (!mapping) {
      // Fall back to regular search
      return this.search(useCase, limit);
    }

    const results: IconSearchResult[] = [];
    for (const term of mapping.terms) {
      if (results.length >= limit) break;
      const searchResults = await this.search(term, Math.ceil(limit / mapping.terms.length));
      
      // Prioritize icons from preferred sets
      const sortedResults = searchResults.sort((a, b) => {
        const aPrefix = a.name.split(':')[0];
        const bPrefix = b.name.split(':')[0];
        const aIndex = mapping.preferredSets.indexOf(aPrefix);
        const bIndex = mapping.preferredSets.indexOf(bPrefix);
        
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      for (const result of sortedResults) {
        if (results.length >= limit) break;
        if (!results.some(r => r.name === result.name)) {
          results.push(result);
        }
      }
    }

    return results;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/collections`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get popular icon sets for assistants
   */
  getPopularIconSets(): string[] {
    return this.popularSets;
  }
}
