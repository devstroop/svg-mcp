import { IconData } from '../types/index.js';
import { ProviderRegistry } from '../providers/registry.js';
import { SvgOptimizer } from '../utils/svg-optimizer.js';
import { cacheManager } from '../utils/cache.js';

interface BatchIconRequest {
  icons: Array<{
    name: string;
    library?: string;
    size?: number;
    color?: string;
  }>;
  optimize?: boolean;
  format?: 'svg' | 'png';
}

/**
 * Fetch multiple icons in a single request
 * Optimized for assistants that need to gather multiple icons at once
 */
export async function getMultipleIcons(args: any) {
  const request = args as BatchIconRequest;
  const { icons, optimize = false, format = 'svg' } = request;

  if (!icons || !Array.isArray(icons) || icons.length === 0) {
    throw new Error('icons parameter is required and must be a non-empty array');
  }

  if (icons.length > 50) {
    throw new Error('Maximum 50 icons can be fetched at once');
  }

  const registry = ProviderRegistry.getInstance();
  const optimizer = optimize ? new SvgOptimizer() : null;
  
  const results: {
    successful: Array<{
      id: string;
      name: string;
      library: string;
      content: string;
      size: number;
      color?: string;
      optimized: boolean;
    }>;
    failed: Array<{
      id: string;
      name: string;
      library: string;
      error: string;
    }>;
  } = {
    successful: [],
    failed: []
  };

  // Process icons in parallel with concurrency limit
  const concurrencyLimit = 5;
  const chunks: typeof icons[] = [];
  
  for (let i = 0; i < icons.length; i += concurrencyLimit) {
    chunks.push(icons.slice(i, i + concurrencyLimit));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async (iconRequest) => {
      const { 
        name, 
        library = 'iconify', 
        size = 24, 
        color 
      } = iconRequest;

      const iconId = `${library}:${name}`;

      try {
        // Check cache first
        const cacheKey = cacheManager.generateIconKey(name, library, format, size);
        const cached = cacheManager.get<IconData>(cacheKey);
        
        if (cached) {
          let content = cached.content;
          if (optimize && format === 'svg' && optimizer) {
            content = await optimizer.optimizeSvg(content);
          }
          
          results.successful.push({
            id: iconId,
            name,
            library,
            content,
            size,
            color,
            optimized: optimize
          });
          return;
        }

        const provider = registry.getProvider(library);
        if (!provider) {
          results.failed.push({
            id: iconId,
            name,
            library,
            error: `Provider not found: ${library}`
          });
          return;
        }

        const iconData = await provider.getIcon(name, {
          format: format as 'svg' | 'png',
          size,
          color
        });

        let content = iconData.content;
        if (optimize && format === 'svg' && optimizer) {
          content = await optimizer.optimizeSvg(content);
        }

        // Cache the result
        cacheManager.set(cacheKey, iconData, 24 * 60 * 60 * 1000);

        results.successful.push({
          id: iconId,
          name,
          library,
          content,
          size,
          color,
          optimized: optimize
        });

      } catch (error) {
        results.failed.push({
          id: iconId,
          name,
          library,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });

    await Promise.all(promises);
  }

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        total: icons.length,
        successful: results.successful.length,
        failed: results.failed.length,
        icons: results.successful,
        errors: results.failed.length > 0 ? results.failed : undefined,
        format,
        optimized: optimize
      }, null, 2)
    }]
  };
}
