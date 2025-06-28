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

    try {
      const icons = await this.loadIcons();
      const iconData = icons[name];

      if (!iconData) {
        throw new Error(`Icon "${name}" not found in Font Awesome`);
      }

      const svgContent = await this.fetchIconSvg(name, style);
      
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
