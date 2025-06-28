import { BaseIconProvider, IconRetrievalOptions } from './base-provider.js';
import { IconSearchResult, IconData } from '../types/index.js';

export class HeroiconsProvider extends BaseIconProvider {
  name = 'heroicons';
  displayName = 'Heroicons';
  baseUrl = 'https://heroicons.com';
  supportedFormats = ['svg'];
  requiresApiKey = false;

  private readonly iconsUrl = 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src';
  private readonly outlineIcons = new Set<string>();
  private readonly solidIcons = new Set<string>();
  private iconsLoaded = false;

  async search(query: string, limit = 20): Promise<IconSearchResult[]> {
    await this.loadIconsIfNeeded();
    
    const results: IconSearchResult[] = [];
    const queryLower = query.toLowerCase();

    // Search in outline icons
    for (const iconName of this.outlineIcons) {
      if (results.length >= limit) break;
      
      if (iconName.toLowerCase().includes(queryLower)) {
        results.push({
          name: iconName,
          library: this.name,
          tags: this.generateTags(iconName),
          category: 'outline',
          url: `https://heroicons.com/${iconName}`,
          preview: `${this.iconsUrl}/24/outline/${iconName}.svg`
        });
      }
    }

    // Search in solid icons if we still need more results
    for (const iconName of this.solidIcons) {
      if (results.length >= limit) break;
      
      if (iconName.toLowerCase().includes(queryLower) && 
          !results.some(r => r.name === iconName)) {
        results.push({
          name: iconName,
          library: this.name,
          tags: this.generateTags(iconName),
          category: 'solid',
          url: `https://heroicons.com/${iconName}`,
          preview: `${this.iconsUrl}/24/solid/${iconName}.svg`
        });
      }
    }

    return results;
  }

  async getIcon(name: string, options: IconRetrievalOptions = {}): Promise<IconData> {
    const { format = 'svg', size = 24, color = '#000000', style = 'outline' } = options;

    if (format !== 'svg') {
      throw new Error('Heroicons only supports SVG format');
    }

    await this.loadIconsIfNeeded();

    // Check if icon exists in the requested style
    const iconSet = style === 'solid' ? this.solidIcons : this.outlineIcons;
    if (!iconSet.has(name)) {
      // Try the other style as fallback
      const fallbackSet = style === 'solid' ? this.outlineIcons : this.solidIcons;
      if (!fallbackSet.has(name)) {
        throw new Error(`Icon "${name}" not found in Heroicons`);
      }
    }

    try {
      const svgContent = await this.fetchIconSvg(name, style as string);
      const customizedSvg = this.customizeSvg(svgContent, size, color);

      return {
        name,
        library: this.name,
        format: 'svg',
        content: customizedSvg,
        size,
        color,
        metadata: {
          category: style as string,
          tags: this.generateTags(name),
          license: 'MIT'
        }
      };
    } catch (error) {
      throw new Error(`Failed to get Heroicons icon: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCategories(): Promise<string[]> {
    return ['outline', 'solid', 'mini'];
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if we can reach the GitHub repository
      const response = await fetch(`${this.iconsUrl}/24/outline`, { method: 'HEAD' });
      return response.ok;
    } catch {
      // If GitHub is down, we can still work with fallback icons
      return true;
    }
  }

  private async loadIconsIfNeeded(): Promise<void> {
    if (this.iconsLoaded) return;

    try {
      // Load outline icons
      const outlineResponse = await fetch(`${this.iconsUrl}/24/outline`);
      if (outlineResponse.ok) {
        const outlineText = await outlineResponse.text();
        this.parseIconNames(outlineText, this.outlineIcons);
      }

      // Load solid icons
      const solidResponse = await fetch(`${this.iconsUrl}/24/solid`);
      if (solidResponse.ok) {
        const solidText = await solidResponse.text();
        this.parseIconNames(solidText, this.solidIcons);
      }

      this.iconsLoaded = true;
    } catch (error) {
      console.warn('Failed to load Heroicons directory:', error);
      // Add some common icons as fallback
      this.addFallbackIcons();
      this.iconsLoaded = true;
    }
  }

  private parseIconNames(directoryHtml: string, iconSet: Set<string>): void {
    // Parse GitHub directory listing to extract .svg filenames
    const svgMatches = directoryHtml.match(/href="[^"]*\/([^"]*\.svg)"/g);
    if (svgMatches) {
      for (const match of svgMatches) {
        const filename = match.match(/([^\/]*\.svg)"/)?.[1];
        if (filename) {
          const iconName = filename.replace('.svg', '');
          iconSet.add(iconName);
        }
      }
    }
  }

  private addFallbackIcons(): void {
    const commonIcons = [
      'home', 'user', 'cog', 'heart', 'star', 'search', 'menu', 'x-mark',
      'chevron-down', 'chevron-up', 'chevron-left', 'chevron-right',
      'plus', 'minus', 'check', 'arrow-right', 'arrow-left', 'bell',
      'envelope', 'phone', 'camera', 'document', 'folder', 'trash'
    ];

    for (const icon of commonIcons) {
      this.outlineIcons.add(icon);
      this.solidIcons.add(icon);
    }
  }

  private async fetchIconSvg(name: string, style: string): Promise<string> {
    const sizeMap: Record<string, string> = {
      'outline': '24/outline',
      'solid': '20/solid',
      'mini': '16/solid'
    };

    const sizePath = sizeMap[style] || '24/outline';
    const svgUrl = `${this.iconsUrl}/${sizePath}/${name}.svg`;

    try {
      const response = await fetch(svgUrl);
      if (!response.ok) {
        throw new Error(`SVG not found: ${svgUrl}`);
      }
      return await response.text();
    } catch (error) {
      // Return a fallback SVG
      return this.generateFallbackSvg(name, style);
    }
  }

  private customizeSvg(svgContent: string, size: number, color: string): string {
    let customized = svgContent;
    
    // Set size
    customized = customized.replace(/width="[^"]*"/, `width="${size}"`);
    customized = customized.replace(/height="[^"]*"/, `height="${size}"`);
    
    // Set color (Heroicons typically use stroke or fill)
    if (customized.includes('stroke=')) {
      customized = customized.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
    }
    if (customized.includes('fill=') && !customized.includes('fill="none"')) {
      customized = customized.replace(/fill="[^"]*"/g, `fill="${color}"`);
    }

    return customized;
  }

  private generateTags(iconName: string): string[] {
    // Convert kebab-case to separate words and use as tags
    return iconName.split('-').filter(part => part.length > 1);
  }

  private generateFallbackSvg(name: string, style: string): string {
    const strokeWidth = style === 'outline' ? '1.5' : '2';
    const fill = style === 'outline' ? 'none' : 'currentColor';
    const stroke = style === 'outline' ? 'currentColor' : 'none';

    return `<svg xmlns="http://www.w3.org/2000/svg" fill="${fill}" viewBox="0 0 24 24" stroke-width="${strokeWidth}" stroke="${stroke}" class="heroicon">
      <title>${name}</title>
      <!-- Heroicon ${name} (${style}) -->
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <text x="12" y="16" text-anchor="middle" font-size="8" fill="currentColor">${name}</text>
    </svg>`;
  }
}
