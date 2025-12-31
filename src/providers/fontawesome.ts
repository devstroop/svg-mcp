import { BaseIconProvider, IconRetrievalOptions } from './base-provider.js';
import { IconSearchResult, IconData } from '../types/index.js';

export class FontAwesomeProvider extends BaseIconProvider {
  name = 'fontawesome';
  displayName = 'Font Awesome';
  baseUrl = 'https://api.fontawesome.com';
  supportedFormats = ['svg', 'png'];
  requiresApiKey = false; // Free tier available

  private readonly freeIconsUrl = 'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/metadata/icons.json';
  private iconsCache: any = null;

  // Map common icon names to Font Awesome specific names
  private readonly iconAliases: Record<string, string> = {
    'home': 'house',
    'settings': 'gear',
    'cog': 'gear',
    'account': 'user',
    'profile': 'user',
    'close': 'xmark',
    'x': 'xmark',
    'menu': 'bars',
    'hamburger': 'bars',
    'search': 'magnifying-glass',
    'find': 'magnifying-glass',
    'mail': 'envelope',
    'email': 'envelope',
    'phone': 'phone',
    'calendar': 'calendar-days',
    'time': 'clock',
    'edit': 'pen-to-square',
    'delete': 'trash',
    'remove': 'trash',
    'add': 'plus',
    'create': 'plus',
    'save': 'floppy-disk',
    'download': 'download',
    'upload': 'upload',
    'share': 'share-nodes',
    'like': 'heart',
    'favorite': 'heart',
    'star': 'star',
    'bookmark': 'bookmark',
    'notification': 'bell',
    'alert': 'bell',
    'warning': 'triangle-exclamation',
    'error': 'circle-exclamation',
    'info': 'circle-info',
    'success': 'circle-check',
    'check': 'check',
    'cart': 'cart-shopping',
    'shopping': 'cart-shopping',
    'money': 'money-bill',
    'payment': 'credit-card',
    'lock': 'lock',
    'unlock': 'lock-open',
    'eye': 'eye',
    'visibility': 'eye',
    'hide': 'eye-slash',
    'copy': 'copy',
    'paste': 'paste',
    'cut': 'scissors',
    'folder': 'folder',
    'file': 'file',
    'document': 'file-lines',
    'image': 'image',
    'photo': 'image',
    'video': 'video',
    'music': 'music',
    'play': 'play',
    'pause': 'pause',
    'stop': 'stop',
    'forward': 'forward',
    'backward': 'backward',
    'refresh': 'arrows-rotate',
    'sync': 'arrows-rotate',
    'loading': 'spinner',
    'spinner': 'spinner',
  };

  private resolveIconName(name: string): string {
    return this.iconAliases[name.toLowerCase()] || name;
  }

  async search(query: string, limit = 20): Promise<IconSearchResult[]> {
    try {
      const icons = await this.loadIcons();
      const results: IconSearchResult[] = [];

      for (const [iconName, iconData] of Object.entries(icons)) {
        if (results.length >= limit) break;

        const icon = iconData as any;
        const searchText = `${iconName} ${icon.label} ${icon.search?.terms?.join(' ') || ''}`.toLowerCase();
        
        if (searchText.includes(query.toLowerCase())) {
          results.push({
            name: iconName,
            library: this.name,
            tags: icon.search?.terms || [],
            category: icon.styles?.[0] || 'solid',
            url: `https://fontawesome.com/icons/${iconName}`,
            preview: this.generatePreviewUrl(iconName, icon.styles?.[0] || 'solid')
          });
        }
      }

      return results;
    } catch (error) {
      console.error('FontAwesome search error:', error);
      return [];
    }
  }

  async getIcon(name: string, options: IconRetrievalOptions = {}): Promise<IconData> {
    const { format = 'svg', size = 24, color = '#000000', style = 'solid' } = options;

    // Resolve alias to actual FA icon name
    const resolvedName = this.resolveIconName(name);

    try {
      const icons = await this.loadIcons();
      const iconData = icons[resolvedName];

      if (!iconData) {
        throw new Error(`Icon "${name}" (resolved: "${resolvedName}") not found in Font Awesome`);
      }

      const svgContent = await this.fetchIconSvg(resolvedName, style);
      
      if (format === 'png') {
        // Convert SVG to PNG (placeholder for now)
        return {
          name,
          library: this.name,
          format: 'png',
          content: this.generatePngPlaceholder(size),
          size,
          color,
          metadata: {
            category: style,
            tags: iconData.search?.terms || [],
            license: iconData.free ? 'free' : 'pro'
          }
        };
      }

      // Return SVG with customizations
      const customizedSvg = this.customizeSvg(svgContent, size, color);

      return {
        name,
        library: this.name,
        format: 'svg',
        content: customizedSvg,
        size,
        color,
        metadata: {
          category: style,
          tags: iconData.search?.terms || [],
          license: iconData.free ? 'free' : 'pro'
        }
      };
    } catch (error) {
      throw new Error(`Failed to get FontAwesome icon: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCategories(): Promise<string[]> {
    return ['solid', 'regular', 'light', 'thin', 'duotone', 'brands'];
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if we can reach the GitHub raw content (more reliable than api.fontawesome.com)
      const response = await fetch(this.freeIconsUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      // If GitHub is down, we can still work with cached data or fallbacks
      return true;
    }
  }

  private async loadIcons(): Promise<any> {
    if (this.iconsCache) {
      return this.iconsCache;
    }

    try {
      const response = await fetch(this.freeIconsUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      this.iconsCache = await response.json();
      return this.iconsCache;
    } catch (error) {
      console.error('Failed to load FontAwesome icons:', error);
      return {};
    }
  }

  private async fetchIconSvg(name: string, style: string): Promise<string> {
    // For free icons, we can construct the SVG URL
    const svgUrl = `https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/${style}/${name}.svg`;
    
    try {
      const response = await fetch(svgUrl);
      if (!response.ok) {
        throw new Error(`SVG not found: ${svgUrl}`);
      }
      
      return await response.text();
    } catch (error) {
      // Fallback to a generic SVG
      return this.generateFallbackSvg(name);
    }
  }

  private customizeSvg(svgContent: string, size: number, color: string): string {
    // Apply size and color customizations
    let customized = svgContent;
    
    // Set width and height
    customized = customized.replace(/width="[^"]*"/, `width="${size}"`);
    customized = customized.replace(/height="[^"]*"/, `height="${size}"`);
    
    // Set fill color
    if (customized.includes('fill=')) {
      customized = customized.replace(/fill="[^"]*"/g, `fill="${color}"`);
    } else {
      customized = customized.replace('<svg', `<svg fill="${color}"`);
    }

    return customized;
  }

  private generatePreviewUrl(name: string, style: string): string {
    return `https://raw.githubusercontent.com/FortAwesome/Font-Awesome/6.x/svgs/${style}/${name}.svg`;
  }

  private generateFallbackSvg(name: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <title>${name}</title>
      <rect width="512" height="512" fill="#f0f0f0" stroke="#ccc" stroke-width="2"/>
      <text x="256" y="256" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="24">${name}</text>
    </svg>`;
  }

  private generatePngPlaceholder(size: number): string {
    // Base64 encoded 1x1 transparent PNG
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  }
}
