import { SvgOptimizer } from '../utils/svg-optimizer.js';
import { ProviderRegistry } from '../providers/registry.js';
import { IconProvider } from '../providers/base-provider.js';

export async function createSprite(args: any) {
  const { icons, library, format = 'svg', optimize = false } = args;

  if (!icons || !Array.isArray(icons) || icons.length === 0) {
    throw new Error('Icons parameter is required and must be a non-empty array');
  }

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

    let spriteContent = '';

    if (format === 'svg') {
      spriteContent = await createSvgSprite(icons, provider, optimize);
    } else if (format === 'png') {
      spriteContent = await createPngSprite(icons, library);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    const spriteSize = spriteContent.length;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          format,
          library,
          iconCount: icons.length,
          icons,
          data: spriteContent,
          optimized: optimize,
          size: spriteSize,
          sizeFormatted: `${(spriteSize / 1024).toFixed(2)} KB`
        }, null, 2)
      }]
    };

  } catch (error) {
    throw new Error(`Failed to create sprite: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function createSvgSprite(icons: string[], provider: IconProvider, optimize: boolean): Promise<string> {
  const iconSize = 24;
  const spacing = 4;
  const columns = Math.ceil(Math.sqrt(icons.length));
  const rows = Math.ceil(icons.length / columns);
  
  const spriteWidth = columns * iconSize + (columns - 1) * spacing;
  const spriteHeight = rows * iconSize + (rows - 1) * spacing;

  let spriteContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${spriteWidth}" height="${spriteHeight}" viewBox="0 0 ${spriteWidth} ${spriteHeight}">
  <defs>
    <style>
      .sprite-icon { fill: currentColor; }
      .sprite-icon:hover { opacity: 0.8; }
    </style>
  </defs>`;

  // Fetch and add each icon to the sprite
  let successfulIcons = 0;
  for (let i = 0; i < icons.length; i++) {
    const iconName = icons[i];
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = col * (iconSize + spacing);
    const y = row * (iconSize + spacing);

    try {
      // Get the actual icon from the provider
      const iconData = await provider.getIcon(iconName, {
        format: 'svg',
        size: iconSize
      });

      // Extract the path/content from the SVG
      const iconContent = extractSvgContent(iconData.content);

      spriteContent += `
  <g id="${iconName}" class="sprite-icon" transform="translate(${x}, ${y})">
    <title>${iconName}</title>
    ${iconContent}
  </g>`;

      successfulIcons++;
    } catch (error) {
      console.warn(`Failed to load icon ${iconName}:`, error);
      // Add placeholder for failed icons
      spriteContent += `
  <g id="${iconName}" class="sprite-icon" transform="translate(${x}, ${y})">
    <title>${iconName} (unavailable)</title>
    <rect width="${iconSize}" height="${iconSize}" fill="#f3f4f6" stroke="#d1d5db" stroke-width="1"/>
    <text x="${iconSize/2}" y="${iconSize/2 + 2}" text-anchor="middle" font-size="8" fill="#6b7280">?</text>
  </g>`;
    }
  }

  spriteContent += '\n</svg>';

  // Apply optimization if requested
  if (optimize) {
    try {
      const optimizer = new SvgOptimizer();
      spriteContent = await optimizer.optimizeSvg(spriteContent);
    } catch (error) {
      console.warn('Sprite optimization failed:', error);
    }
  }

  return spriteContent;
}

async function createPngSprite(icons: string[], library: string): Promise<string> {
  // This is a placeholder implementation
  // In a real implementation, you would:
  // 1. Get each icon as PNG or convert from SVG
  // 2. Use a library like Sharp to combine them into a sprite sheet
  // 3. Return the base64-encoded PNG sprite
  
  const mockPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  return `data:image/png;base64,${mockPngBase64}`;
}

function extractSvgContent(svgString: string): string {
  // Extract the content inside <svg> tags, excluding the <svg> wrapper itself
  const match = svgString.match(/<svg[^>]*>(.*?)<\/svg>/s);
  if (match && match[1]) {
    // Remove any existing transforms and adjust for sprite positioning
    let content = match[1].trim();
    
    // Remove existing viewBox-dependent elements that might break in sprite context
    content = content.replace(/width="[^"]*"/g, '');
    content = content.replace(/height="[^"]*"/g, '');
    
    return content;
  }
  
  // Fallback: return a simple shape
  return `<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none"/>`;
}
