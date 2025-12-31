import { IconProvider } from './base-provider.js';
import { FontAwesomeProvider } from './fontawesome.js';
import { MaterialIconsProvider } from './material.js';
import { HeroiconsProvider } from './heroicons.js';
import { IconifyProvider } from './iconify.js';

export interface LibraryInfo {
  name: string;
  displayName: string;
  description: string;
  iconCount: string;
  license: string;
  website: string;
  recommended: boolean;
}

export class ProviderRegistry {
  private providers: Map<string, IconProvider> = new Map();
  private static instance: ProviderRegistry;
  private iconifyProvider: IconifyProvider;

  private constructor() {
    this.iconifyProvider = new IconifyProvider();
    this.initializeProviders();
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  private initializeProviders(): void {
    // Initialize providers with API keys from environment variables
    const fontAwesomeApiKey = process.env.FONTAWESOME_API_KEY;
    const materialApiKey = process.env.MATERIAL_API_KEY;

    // Iconify is the primary provider - access to 200,000+ icons
    this.providers.set('iconify', this.iconifyProvider);
    
    // Legacy providers for backwards compatibility
    this.providers.set('fontawesome', new FontAwesomeProvider(fontAwesomeApiKey));
    this.providers.set('material', new MaterialIconsProvider(materialApiKey));
    this.providers.set('heroicons', new HeroiconsProvider());
  }

  getIconifyProvider(): IconifyProvider {
    return this.iconifyProvider;
  }

  /**
   * Get detailed information about available icon libraries
   */
  getLibraryInfo(): LibraryInfo[] {
    return [
      {
        name: 'iconify',
        displayName: 'Iconify (Universal)',
        description: 'Access to 200,000+ icons from 150+ icon sets including Material Design, Font Awesome, Heroicons, Lucide, Tabler, and many more. Use format "prefix:name" (e.g., "mdi:home", "lucide:settings").',
        iconCount: '200,000+',
        license: 'Various (per icon set)',
        website: 'https://iconify.design',
        recommended: true
      },
      {
        name: 'fontawesome',
        displayName: 'Font Awesome',
        description: 'Popular icon library with solid, regular, and brand icons.',
        iconCount: '2,000+ free',
        license: 'Font Awesome Free License',
        website: 'https://fontawesome.com',
        recommended: false
      },
      {
        name: 'material',
        displayName: 'Material Design Icons',
        description: 'Google\'s Material Design icon set.',
        iconCount: '2,500+',
        license: 'Apache 2.0',
        website: 'https://fonts.google.com/icons',
        recommended: false
      },
      {
        name: 'heroicons',
        displayName: 'Heroicons',
        description: 'Beautiful hand-crafted SVG icons by the Tailwind CSS team.',
        iconCount: '450+',
        license: 'MIT',
        website: 'https://heroicons.com',
        recommended: false
      }
    ];
  }

  /**
   * Get popular icon set prefixes for the Iconify provider
   */
  getPopularIconSets(): { prefix: string; name: string; description: string }[] {
    return [
      { prefix: 'mdi', name: 'Material Design Icons', description: '7000+ icons, great for general UI' },
      { prefix: 'lucide', name: 'Lucide', description: 'Clean, consistent icons for modern apps' },
      { prefix: 'heroicons', name: 'Heroicons', description: 'Tailwind CSS team, outline and solid styles' },
      { prefix: 'tabler', name: 'Tabler Icons', description: '4500+ customizable icons' },
      { prefix: 'ph', name: 'Phosphor Icons', description: 'Flexible icons with multiple weights' },
      { prefix: 'fa6-solid', name: 'Font Awesome 6 Solid', description: 'Classic solid icons' },
      { prefix: 'fa6-regular', name: 'Font Awesome 6 Regular', description: 'Classic outline icons' },
      { prefix: 'fa6-brands', name: 'Font Awesome 6 Brands', description: 'Brand/logo icons' },
      { prefix: 'bi', name: 'Bootstrap Icons', description: 'Bootstrap\'s official icons' },
      { prefix: 'ri', name: 'Remix Icons', description: 'Neutral-style icons' },
      { prefix: 'carbon', name: 'Carbon Icons', description: 'IBM\'s design system icons' },
      { prefix: 'fluent', name: 'Fluent UI Icons', description: 'Microsoft\'s Fluent design icons' },
      { prefix: 'simple-icons', name: 'Simple Icons', description: '2800+ brand/logo icons' },
      { prefix: 'octicon', name: 'Octicons', description: 'GitHub\'s icon set' },
      { prefix: 'ion', name: 'Ionicons', description: 'Ionic framework icons' },
    ];
  }

  getProvider(name: string): IconProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  getAllProviders(): IconProvider[] {
    return Array.from(this.providers.values());
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async getActiveProviders(): Promise<IconProvider[]> {
    const activeProviders: IconProvider[] = [];
    
    for (const provider of this.providers.values()) {
      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          activeProviders.push(provider);
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} is not available:`, error);
      }
    }

    return activeProviders;
  }

  addProvider(provider: IconProvider): void {
    this.providers.set(provider.name, provider);
  }

  removeProvider(name: string): boolean {
    return this.providers.delete(name.toLowerCase());
  }
}
