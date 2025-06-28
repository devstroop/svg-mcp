import { optimize } from 'svgo';
import { SvgOptimizationOptions } from '../types/index.js';

export class SvgOptimizer {
  private defaultOptions: SvgOptimizationOptions = {
    removeMetadata: true,
    removeComments: true,
    removeDimensions: false,
    removeViewBox: false,
    removeStyleElements: true,
    removeScriptElements: true,
    removeTitle: false,
    removeDesc: false,
    removeUselessDefs: true,
    removeEditorsNSData: true,
    removeEmptyAttrs: true,
    removeHiddenElems: true,
    removeEmptyText: true,
    removeEmptyContainers: true,
    cleanupIDs: true,
    minifyStyles: true,
    convertColors: {
      currentColor: false,
      names2hex: true,
      rgb2hex: true,
    },
  };

  async optimizeSvg(svgContent: string, options?: Partial<SvgOptimizationOptions>): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      const result = optimize(svgContent, {
        plugins: [
          'preset-default'
        ],
      });

      return result.data;
    } catch (error) {
      throw new Error(`SVG optimization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Detect and remove common placeholder patterns
  removePlaceholders(svgContent: string): string {
    let cleaned = svgContent;

    // Remove placeholder rectangles with common patterns
    const placeholderPatterns = [
      /<rect[^>]*placeholder[^>]*\/?>.*?<\/rect>/gi,
      /<rect[^>]*temp[^>]*\/?>.*?<\/rect>/gi,
      /<g[^>]*placeholder[^>]*>.*?<\/g>/gi,
      /<g[^>]*temp[^>]*>.*?<\/g>/gi,
      // Remove elements with placeholder colors
      /<[^>]*fill="?#?(ff00ff|magenta|00ff00|lime)"?[^>]*>.*?<\/[^>]*>/gi,
      // Remove debug layers
      /<g[^>]*debug[^>]*>.*?<\/g>/gi,
      /<g[^>]*layer.*debug[^>]*>.*?<\/g>/gi,
    ];

    placeholderPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned;
  }

  // Clean up common editor artifacts
  removeEditorArtifacts(svgContent: string): string {
    let cleaned = svgContent;

    // Remove common editor namespaces and attributes
    const editorPatterns = [
      /xmlns:sketch="[^"]*"/g,
      /xmlns:ai="[^"]*"/g,
      /ai:[^=]*="[^"]*"/g,
      /sketch:[^=]*="[^"]*"/g,
      /data-name="[^"]*"/g,
      /class="cls-\d+"/g,
    ];

    editorPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned;
  }
}

export const svgOptimizer = new SvgOptimizer();
