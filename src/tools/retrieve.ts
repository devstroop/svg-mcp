import { IconData } from '../types/index.js';
import { cacheManager } from '../utils/cache.js';
import { SvgOptimizer } from '../utils/svg-optimizer.js';
import { ProviderRegistry } from '../providers/registry.js';

export async function getIcon(args: any) {
  const { 
    name, 
    library = 'iconify', 
    format = 'svg', 
    size = 24, 
    color,
    optimize = false 
  } = args;

  if (!name) {
    throw new Error('Name parameter is required');
  }

  try {
    // Check cache first
    const cacheKey = cacheManager.generateIconKey(name, library, format, size);
    const cachedIcon = cacheManager.get<IconData>(cacheKey);
    
    if (cachedIcon) {
      let iconContent = cachedIcon.content;
      
      // Apply optimization if requested and not already optimized
      if (optimize && format === 'svg' && !iconContent.includes('<!-- optimized -->')) {
        const optimizer = new SvgOptimizer();
        iconContent = await optimizer.optimizeSvg(iconContent);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            name: cachedIcon.name,
            library: cachedIcon.library,
            format: cachedIcon.format,
            size: cachedIcon.size,
            color: cachedIcon.color,
            content: iconContent,
            cached: true,
            optimized: optimize && format === 'svg',
            metadata: cachedIcon.metadata
          }, null, 2)
        }]
      };
    }

    const registry = ProviderRegistry.getInstance();
    const provider = registry.getProvider(library);

    if (!provider) {
      throw new Error(`Provider not found: ${library}`);
    }

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new Error(`Provider not available: ${library}`);
    }

    // Get icon from provider
    const iconData = await provider.getIcon(name, {
      format: format as 'svg' | 'png',
      size,
      color
    });

    // Apply SVG optimization if requested
    let finalContent = iconData.content;
    if (optimize && format === 'svg') {
      const optimizer = new SvgOptimizer();
      finalContent = await optimizer.optimizeSvg(iconData.content);
    }

    const finalIconData: IconData = {
      ...iconData,
      content: finalContent
    };

    // Cache the result for 24 hours
    cacheManager.set(cacheKey, finalIconData, 24 * 60 * 60 * 1000);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          name: finalIconData.name,
          library: finalIconData.library,
          format: finalIconData.format,
          size: finalIconData.size,
          color: finalIconData.color,
          content: finalIconData.content,
          cached: false,
          optimized: optimize && format === 'svg',
          metadata: finalIconData.metadata
        }, null, 2)
      }]
    };

  } catch (error) {
    throw new Error(`Failed to retrieve icon: ${error instanceof Error ? error.message : String(error)}`);
  }
}
