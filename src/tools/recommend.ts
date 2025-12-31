import { ProviderRegistry } from '../providers/registry.js';
import { cacheManager } from '../utils/cache.js';

interface RecommendationRequest {
  useCase: string;
  style?: 'outline' | 'solid' | 'filled' | 'any';
  preferredSets?: string[];
  limit?: number;
}

/**
 * Recommend icons based on use case - optimized for AI assistants
 * This provides contextual icon suggestions based on common UI patterns
 */
export async function recommendIcons(args: any) {
  const request = args as RecommendationRequest;
  const { useCase, style = 'any', limit = 10 } = request;

  if (!useCase || typeof useCase !== 'string') {
    throw new Error('useCase parameter is required and must be a string');
  }

  try {
    // Check cache
    const cacheKey = `recommend:${useCase}:${style}:${limit}`;
    const cached = cacheManager.get<any>(cacheKey);
    if (cached) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ...cached, cached: true }, null, 2)
        }]
      };
    }

    const registry = ProviderRegistry.getInstance();
    const iconifyProvider = registry.getIconifyProvider();

    // Use case to search terms and icon suggestions mapping
    const useCaseDatabase: Record<string, {
      description: string;
      searchTerms: string[];
      suggestedIcons: string[];
      preferredSets: string[];
    }> = {
      // Navigation & Layout
      'navigation': {
        description: 'Navigation elements like menus, arrows, and directional controls',
        searchTerms: ['menu', 'home', 'arrow', 'chevron', 'hamburger', 'navigation'],
        suggestedIcons: ['lucide:menu', 'lucide:home', 'lucide:arrow-left', 'lucide:arrow-right', 'lucide:chevron-down', 'mdi:menu', 'heroicons:bars-3'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'sidebar': {
        description: 'Sidebar navigation and collapsible panels',
        searchTerms: ['sidebar', 'panel', 'layout', 'menu'],
        suggestedIcons: ['lucide:panel-left', 'lucide:panel-right', 'lucide:layout-sidebar', 'mdi:view-sidebar', 'tabler:layout-sidebar'],
        preferredSets: ['lucide', 'mdi', 'tabler']
      },
      'breadcrumb': {
        description: 'Breadcrumb navigation elements',
        searchTerms: ['chevron', 'arrow', 'separator', 'slash'],
        suggestedIcons: ['lucide:chevron-right', 'lucide:slash', 'mdi:chevron-right', 'heroicons:chevron-right'],
        preferredSets: ['lucide', 'heroicons']
      },

      // Actions & Buttons
      'actions': {
        description: 'Common action buttons like add, edit, delete',
        searchTerms: ['add', 'edit', 'delete', 'save', 'cancel', 'close'],
        suggestedIcons: ['lucide:plus', 'lucide:pencil', 'lucide:trash-2', 'lucide:save', 'lucide:x', 'lucide:check'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'crud': {
        description: 'Create, Read, Update, Delete operations',
        searchTerms: ['create', 'read', 'update', 'delete', 'add', 'edit', 'view', 'remove'],
        suggestedIcons: ['lucide:plus', 'lucide:eye', 'lucide:pencil', 'lucide:trash-2', 'mdi:plus', 'mdi:eye', 'mdi:pencil', 'mdi:delete'],
        preferredSets: ['lucide', 'mdi', 'heroicons']
      },

      // User & Account
      'user': {
        description: 'User account and profile related icons',
        searchTerms: ['user', 'account', 'profile', 'avatar', 'person'],
        suggestedIcons: ['lucide:user', 'lucide:user-circle', 'lucide:users', 'lucide:user-plus', 'heroicons:user', 'mdi:account'],
        preferredSets: ['lucide', 'heroicons', 'mdi']
      },
      'authentication': {
        description: 'Login, logout, security related icons',
        searchTerms: ['login', 'logout', 'lock', 'unlock', 'key', 'shield', 'password'],
        suggestedIcons: ['lucide:log-in', 'lucide:log-out', 'lucide:lock', 'lucide:key', 'lucide:shield', 'lucide:eye', 'lucide:eye-off'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },

      // Communication
      'communication': {
        description: 'Messaging, email, and communication icons',
        searchTerms: ['mail', 'message', 'chat', 'phone', 'notification', 'bell'],
        suggestedIcons: ['lucide:mail', 'lucide:message-circle', 'lucide:phone', 'lucide:bell', 'lucide:send', 'lucide:inbox'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'social': {
        description: 'Social interactions like sharing, liking',
        searchTerms: ['share', 'like', 'heart', 'comment', 'bookmark', 'star'],
        suggestedIcons: ['lucide:share', 'lucide:heart', 'lucide:message-square', 'lucide:bookmark', 'lucide:star', 'lucide:thumbs-up'],
        preferredSets: ['lucide', 'heroicons', 'ph']
      },

      // E-commerce
      'ecommerce': {
        description: 'Shopping, cart, and e-commerce icons',
        searchTerms: ['cart', 'shop', 'bag', 'payment', 'credit-card', 'store'],
        suggestedIcons: ['lucide:shopping-cart', 'lucide:shopping-bag', 'lucide:credit-card', 'lucide:store', 'lucide:package', 'lucide:truck'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'payment': {
        description: 'Payment and financial icons',
        searchTerms: ['payment', 'credit-card', 'wallet', 'money', 'dollar', 'receipt'],
        suggestedIcons: ['lucide:credit-card', 'lucide:wallet', 'lucide:banknote', 'lucide:receipt', 'lucide:coins'],
        preferredSets: ['lucide', 'heroicons', 'mdi']
      },

      // Files & Documents
      'files': {
        description: 'File and document management icons',
        searchTerms: ['file', 'folder', 'document', 'download', 'upload', 'attachment'],
        suggestedIcons: ['lucide:file', 'lucide:folder', 'lucide:download', 'lucide:upload', 'lucide:paperclip', 'lucide:file-text'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'media': {
        description: 'Images, videos, and media control icons',
        searchTerms: ['image', 'video', 'play', 'pause', 'music', 'camera'],
        suggestedIcons: ['lucide:image', 'lucide:video', 'lucide:play', 'lucide:pause', 'lucide:music', 'lucide:camera'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },

      // Status & Feedback
      'status': {
        description: 'Status indicators and feedback icons',
        searchTerms: ['check', 'warning', 'error', 'info', 'success', 'alert'],
        suggestedIcons: ['lucide:check', 'lucide:check-circle', 'lucide:alert-triangle', 'lucide:alert-circle', 'lucide:info', 'lucide:x-circle'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'loading': {
        description: 'Loading and progress indicators',
        searchTerms: ['loading', 'spinner', 'loader', 'refresh', 'sync'],
        suggestedIcons: ['lucide:loader-2', 'lucide:refresh-cw', 'lucide:loader', 'mdi:loading', 'tabler:loader'],
        preferredSets: ['lucide', 'mdi', 'tabler']
      },

      // Settings & Configuration
      'settings': {
        description: 'Settings, preferences, and configuration icons',
        searchTerms: ['settings', 'gear', 'cog', 'preferences', 'config', 'options'],
        suggestedIcons: ['lucide:settings', 'lucide:sliders', 'lucide:wrench', 'lucide:toggle-left', 'heroicons:cog-6-tooth'],
        preferredSets: ['lucide', 'heroicons', 'mdi']
      },

      // Data & Analytics
      'analytics': {
        description: 'Charts, graphs, and analytics icons',
        searchTerms: ['chart', 'graph', 'analytics', 'statistics', 'bar', 'pie'],
        suggestedIcons: ['lucide:bar-chart', 'lucide:line-chart', 'lucide:pie-chart', 'lucide:trending-up', 'lucide:activity'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },
      'dashboard': {
        description: 'Dashboard and overview related icons',
        searchTerms: ['dashboard', 'grid', 'layout', 'widgets', 'overview'],
        suggestedIcons: ['lucide:layout-dashboard', 'lucide:grid', 'lucide:bar-chart-2', 'lucide:activity', 'mdi:view-dashboard'],
        preferredSets: ['lucide', 'mdi', 'tabler']
      },

      // Development & Code
      'development': {
        description: 'Code, programming, and development icons',
        searchTerms: ['code', 'terminal', 'git', 'branch', 'bug', 'database'],
        suggestedIcons: ['lucide:code', 'lucide:terminal', 'lucide:git-branch', 'lucide:bug', 'lucide:database', 'lucide:server'],
        preferredSets: ['lucide', 'octicon', 'tabler']
      },

      // Social Media Brands
      'brands': {
        description: 'Brand and company logos',
        searchTerms: ['github', 'twitter', 'facebook', 'google', 'linkedin'],
        suggestedIcons: ['simple-icons:github', 'simple-icons:x', 'simple-icons:facebook', 'simple-icons:google', 'simple-icons:linkedin', 'simple-icons:discord'],
        preferredSets: ['simple-icons', 'fa6-brands']
      },

      // Weather
      'weather': {
        description: 'Weather and climate icons',
        searchTerms: ['sun', 'moon', 'cloud', 'rain', 'snow', 'wind'],
        suggestedIcons: ['lucide:sun', 'lucide:moon', 'lucide:cloud', 'lucide:cloud-rain', 'lucide:snowflake', 'lucide:wind'],
        preferredSets: ['lucide', 'wi', 'tabler']
      },

      // Time & Calendar
      'calendar': {
        description: 'Calendar and scheduling icons',
        searchTerms: ['calendar', 'clock', 'time', 'schedule', 'event', 'date'],
        suggestedIcons: ['lucide:calendar', 'lucide:clock', 'lucide:calendar-days', 'lucide:timer', 'lucide:alarm-clock'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      },

      // Search & Filter
      'search': {
        description: 'Search and filter icons',
        searchTerms: ['search', 'filter', 'sort', 'find', 'magnify'],
        suggestedIcons: ['lucide:search', 'lucide:filter', 'lucide:sliders-horizontal', 'lucide:arrow-up-down', 'lucide:x'],
        preferredSets: ['lucide', 'heroicons', 'tabler']
      }
    };

    // Normalize use case
    const normalizedUseCase = useCase.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Find matching use case or partial match
    let matchedCase = useCaseDatabase[normalizedUseCase];
    
    if (!matchedCase) {
      // Try to find partial matches
      for (const [key, value] of Object.entries(useCaseDatabase)) {
        if (normalizedUseCase.includes(key) || key.includes(normalizedUseCase)) {
          matchedCase = value;
          break;
        }
      }
    }

    if (!matchedCase) {
      // Fall back to search
      const searchResults = await iconifyProvider.search(useCase, limit);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            useCase,
            matched: false,
            suggestion: `No predefined recommendations for "${useCase}". Here are search results:`,
            icons: searchResults.map(r => ({
              id: r.name,
              preview: r.preview,
              tags: r.tags
            })),
            tip: 'Try use cases like: navigation, user, ecommerce, files, status, settings, brands, authentication'
          }, null, 2)
        }]
      };
    }

    // Get actual icon data for suggested icons
    const suggestedIcons = matchedCase.suggestedIcons.slice(0, limit);
    const iconDetails = [];

    for (const iconId of suggestedIcons) {
      try {
        iconDetails.push({
          id: iconId,
          preview: `https://api.iconify.design/${iconId.replace(':', '/')}.svg`,
          usage: {
            html: `<span class="iconify" data-icon="${iconId}"></span>`,
            react: `<Icon icon="${iconId}" />`,
            svg: `fetch from get_icon tool with name="${iconId}", library="iconify"`
          }
        });
      } catch {
        // Skip icons that can't be fetched
      }
    }

    const result = {
      useCase,
      matched: true,
      description: matchedCase.description,
      recommendedIcons: iconDetails,
      searchTerms: matchedCase.searchTerms,
      preferredIconSets: matchedCase.preferredSets.map(p => ({
        prefix: p,
        searchExample: `${p}:${matchedCase.searchTerms[0]}`
      })),
      howToUse: {
        getIcon: {
          tool: 'get_icon',
          example: { name: suggestedIcons[0], library: 'iconify', size: 24 }
        },
        search: {
          tool: 'search_icons',
          example: { query: matchedCase.searchTerms[0], libraries: ['iconify'], limit: 10 }
        }
      }
    };

    // Cache for 1 hour
    cacheManager.set(cacheKey, result, 60 * 60 * 1000);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };

  } catch (error) {
    throw new Error(`Failed to get recommendations: ${error instanceof Error ? error.message : String(error)}`);
  }
}
