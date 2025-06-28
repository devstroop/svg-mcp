import { SvgOptimizationOptions } from '../types/index.js';
import { SvgOptimizer } from '../utils/svg-optimizer.js';

export async function optimizeSvg(args: any) {
  const { svgContent, options = {} } = args;

  if (!svgContent || typeof svgContent !== 'string') {
    throw new Error('svgContent parameter is required and must be a string');
  }

  if (!svgContent.trim().startsWith('<svg')) {
    throw new Error('svgContent must be valid SVG markup');
  }

  try {
    const optimizer = new SvgOptimizer();
    const optimizeOptions: Partial<SvgOptimizationOptions> = {
      removeMetadata: options.removeMetadata ?? true,
      removeComments: options.removeComments ?? true,
      removeDimensions: options.removeDimensions ?? false,
      removeViewBox: options.removeViewBox ?? false,
      removeStyleElements: options.removeStyleElements ?? true,
      removeScriptElements: options.removeScriptElements ?? true,
      removeTitle: options.removeTitle ?? false,
      removeDesc: options.removeDesc ?? false,
      removeUselessDefs: options.removeUselessDefs ?? true,
      removeEditorsNSData: options.removeEditorsNSData ?? true,
      removeEmptyAttrs: options.removeEmptyAttrs ?? true,
      removeHiddenElems: options.removeHiddenElems ?? true,
      removeEmptyText: options.removeEmptyText ?? true,
      removeEmptyContainers: options.removeEmptyContainers ?? true,
      cleanupIDs: options.cleanupIDs ?? true,
      minifyStyles: options.minifyStyles ?? true,
      convertColors: {
        currentColor: options.convertColors?.currentColor ?? false,
        names2hex: options.convertColors?.names2hex ?? true,
        rgb2hex: options.convertColors?.rgb2hex ?? true,
      }
    };

    const originalSize = svgContent.length;
    const optimizedContent = await optimizer.optimizeSvg(svgContent, optimizeOptions);
    const optimizedSize = optimizedContent.length;
    const compressionRatio = Math.round((1 - optimizedSize / originalSize) * 100);
    
    // Generate list of applied optimizations
    const appliedOptimizations = Object.entries(optimizeOptions)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => key);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          originalSize,
          optimizedSize,
          compressionRatio: `${compressionRatio}%`,
          savings: `${originalSize - optimizedSize} bytes`,
          appliedOptimizations,
          data: optimizedContent,
          options: optimizeOptions
        }, null, 2)
      }]
    };

  } catch (error) {
    throw new Error(`Failed to optimize SVG: ${error instanceof Error ? error.message : String(error)}`);
  }
}
