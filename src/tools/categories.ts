import { ProviderRegistry } from '../providers/registry.js';

export async function listCategories(args: any) {
  const { library } = args;

  if (!library) {
    throw new Error('Library parameter is required');
  }

  try {
    const registry = ProviderRegistry.getInstance();
    const provider = registry.getProvider(library);

    if (!provider) {
      throw new Error(`Provider not found: ${library}`);
    }

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new Error(`Provider not available: ${library}`);
    }

    const categories = await provider.getCategories();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          library,
          categories: categories.map(category => ({
            name: category,
            // In a real implementation, you might want to get icon counts per category
            count: 0,
            description: `Icons in the ${category} category`
          })),
          totalCategories: categories.length,
          provider: provider.displayName
        }, null, 2)
      }]
    };

  } catch (error) {
    throw new Error(`Failed to list categories: ${error instanceof Error ? error.message : String(error)}`);
  }
}
