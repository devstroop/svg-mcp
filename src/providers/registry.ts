import { IconProvider } from './base-provider.js';
import { FontAwesomeProvider } from './fontawesome.js';
import { MaterialIconsProvider } from './material.js';
import { HeroiconsProvider } from './heroicons.js';

export class ProviderRegistry {
  private providers: Map<string, IconProvider> = new Map();
  private static instance: ProviderRegistry;

  private constructor() {
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

    this.providers.set('fontawesome', new FontAwesomeProvider(fontAwesomeApiKey));
    this.providers.set('material', new MaterialIconsProvider(materialApiKey));
    this.providers.set('heroicons', new HeroiconsProvider());
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
