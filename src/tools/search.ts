import { IconSearchResult } from '../types/index.js';
import { cacheManager } from '../utils/cache.js';
import { ProviderRegistry } from '../providers/registry.js';

export async function searchIcons(args: any) {
  const { query, libraries = ['iconify'], limit = 20 } = args;
  
  if (!query || typeof query !== 'string') {
    throw new Error('Query parameter is required and must be a string');
  }

  try {
    // Check cache first
    const cacheKey = cacheManager.generateSearchKey(query, libraries, limit);
    const cachedResult = cacheManager.get<IconSearchResult[]>(cacheKey);
    
    if (cachedResult) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            query,
            libraries,
            results: cachedResult,
            total: cachedResult.length,
            cached: true,
            hasMore: cachedResult.length >= limit
          }, null, 2)
        }]
      };
    }

    const registry = ProviderRegistry.getInstance();
    const allResults: IconSearchResult[] = [];

    // Search across requested libraries
    for (const libraryName of libraries) {
      const provider = registry.getProvider(libraryName);
      
      if (!provider) {
        console.warn(`Provider not found: ${libraryName}`);
        continue;
      }

      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          console.warn(`Provider not available: ${libraryName}`);
          continue;
        }

        const results = await provider.search(query, Math.ceil(limit / libraries.length));
        allResults.push(...results);
      } catch (error) {
        console.error(`Error searching ${libraryName}:`, error);
        // Continue with other providers even if one fails
      }
    }

    // Sort results by relevance (simple scoring based on exact matches)
    const sortedResults = allResults
      .sort((a, b) => {
        const aScore = calculateRelevanceScore(a, query);
        const bScore = calculateRelevanceScore(b, query);
        return bScore - aScore;
      })
      .slice(0, limit);

    // Cache the results for 1 hour
    cacheManager.set(cacheKey, sortedResults, 60 * 60 * 1000);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          libraries,
          results: sortedResults,
          total: sortedResults.length,
          cached: false,
          hasMore: allResults.length > limit,
          providersUsed: libraries.filter((lib: string) => registry.getProvider(lib))
        }, null, 2)
      }]
    };

  } catch (error) {
    throw new Error(`Failed to search icons: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function calculateRelevanceScore(icon: IconSearchResult, query: string): number {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Exact name match gets highest score
  if (icon.name.toLowerCase() === queryLower) {
    score += 100;
  } else if (icon.name.toLowerCase().includes(queryLower)) {
    score += 50;
  }

  // Tag matches
  const matchingTags = icon.tags.filter(tag => 
    tag.toLowerCase().includes(queryLower)
  );
  score += matchingTags.length * 10;

  // Category match
  if (icon.category && icon.category.toLowerCase().includes(queryLower)) {
    score += 20;
  }

  return score;
}
