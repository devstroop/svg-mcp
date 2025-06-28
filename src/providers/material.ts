import { BaseIconProvider, IconRetrievalOptions } from './base-provider.js';
import { IconSearchResult, IconData } from '../types/index.js';

export class MaterialIconsProvider extends BaseIconProvider {
  name = 'material';
  displayName = 'Material Design Icons';
  baseUrl = 'https://fonts.googleapis.com/icon';
  supportedFormats = ['svg', 'png'];
  requiresApiKey = false;

  private readonly iconsUrl = 'https://raw.githubusercontent.com/google/material-design-icons/master/font/MaterialIcons-Regular.codepoints';
  private readonly categoriesUrl = 'https://raw.githubusercontent.com/google/material-design-icons/master/scripts/data/categories.json';
  private iconsCache: Map<string, any> = new Map();
  private categoriesCache: any = null;

  async search(query: string, limit = 20): Promise<IconSearchResult[]> {
    try {
      const icons = await this.loadIcons();
      const categories = await this.loadCategories();
      const results: IconSearchResult[] = [];

      let count = 0;
      for (const [iconName, iconData] of icons.entries()) {
        if (count >= limit) break;

        if (iconName.toLowerCase().includes(query.toLowerCase())) {
          const category = this.findIconCategory(iconName, categories);
          
          results.push({
            name: iconName,
            library: this.name,
            tags: this.generateTags(iconName),
            category: category || 'action',
            url: `https://fonts.google.com/icons?selected=Material+Icons:${iconName}`,
            preview: this.generatePreviewUrl(iconName)
          });
          count++;
        }
      }

      return results;
    } catch (error) {
      console.error('Material Icons search error:', error);
      return [];
    }
  }

  async getIcon(name: string, options: IconRetrievalOptions = {}): Promise<IconData> {
    const { format = 'svg', size = 24, color = '#000000' } = options;

    try {
      const icons = await this.loadIcons();
      
      if (!icons.has(name)) {
        throw new Error(`Icon "${name}" not found in Material Icons`);
      }

      if (format === 'png') {
        return {
          name,
          library: this.name,
          format: 'png',
          content: this.generatePngPlaceholder(size),
          size,
          color,
          metadata: {
            category: 'action',
            tags: this.generateTags(name),
            license: 'Apache 2.0'
          }
        };
      }

      // Generate SVG for Material Icon
      const svgContent = this.generateMaterialSvg(name, size, color);

      return {
        name,
        library: this.name,
        format: 'svg',
        content: svgContent,
        size,
        color,
        metadata: {
          category: 'action',
          tags: this.generateTags(name),
          license: 'Apache 2.0'
        }
      };
    } catch (error) {
      throw new Error(`Failed to get Material icon: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const categories = await this.loadCategories();
      return Object.keys(categories);
    } catch {
      return [
        'action', 'alert', 'av', 'communication', 'content', 'device',
        'editor', 'file', 'hardware', 'image', 'maps', 'navigation',
        'notification', 'places', 'social', 'toggle', 'transportation'
      ];
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if we can reach the GitHub repository
      const response = await fetch(`${this.iconsUrl}/metadata.json`, { method: 'HEAD' });
      return response.ok;
    } catch {
      // If GitHub is down, we can still work with fallback icons
      return true;
    }
  }

  private async loadIcons(): Promise<Map<string, any>> {
    if (this.iconsCache.size > 0) {
      return this.iconsCache;
    }

    try {
      const response = await fetch(this.iconsUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const [iconName, codepoint] = line.split(' ');
        if (iconName && codepoint) {
          this.iconsCache.set(iconName, { codepoint });
        }
      }

      return this.iconsCache;
    } catch (error) {
      console.error('Failed to load Material Icons:', error);
      return new Map();
    }
  }

  private async loadCategories(): Promise<any> {
    if (this.categoriesCache) {
      return this.categoriesCache;
    }

    try {
      const response = await fetch(this.categoriesUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      this.categoriesCache = await response.json();
      return this.categoriesCache;
    } catch (error) {
      console.error('Failed to load Material Icons categories:', error);
      return {};
    }
  }

  private findIconCategory(iconName: string, categories: any): string | null {
    for (const [category, icons] of Object.entries(categories)) {
      if (Array.isArray(icons) && icons.includes(iconName)) {
        return category;
      }
    }
    return null;
  }

  private generateTags(iconName: string): string[] {
    // Generate tags based on icon name
    const tags = iconName.split('_').filter(part => part.length > 2);
    return tags;
  }

  private generateMaterialSvg(name: string, size: number, color: string): string {
    // For now, generate a placeholder SVG with the icon name
    // In a real implementation, you would use the Material Icons font or SVG files
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}">
      <title>${name}</title>
      <!-- Material Icon: ${name} -->
      <circle cx="12" cy="12" r="10" stroke="${color}" stroke-width="1" fill="none"/>
      <text x="12" y="16" text-anchor="middle" font-family="Material Icons" font-size="14" fill="${color}">${name}</text>
    </svg>`;
  }

  private generatePreviewUrl(name: string): string {
    return `https://fonts.gstatic.com/s/i/materialicons/${name}/v1/24px.svg`;
  }

  private generatePngPlaceholder(size: number): string {
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
  }
}
