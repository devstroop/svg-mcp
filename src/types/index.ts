export interface IconSearchResult {
  name: string;
  library: string;
  tags: string[];
  category: string;
  url?: string;
  preview?: string;
}

export interface IconData {
  name: string;
  library: string;
  format: 'svg' | 'png';
  content: string;
  size?: number;
  color?: string;
  metadata?: {
    category: string;
    tags: string[];
    license: string;
  };
}

export interface IconLibrary {
  name: string;
  displayName: string;
  baseUrl: string;
  apiKey?: string;
  categories: string[];
}

export interface SvgOptimizationOptions {
  removeMetadata?: boolean;
  removeComments?: boolean;
  removeDimensions?: boolean;
  removeViewBox?: boolean;
  removeStyleElements?: boolean;
  removeScriptElements?: boolean;
  removeTitle?: boolean;
  removeDesc?: boolean;
  removeUselessDefs?: boolean;
  removeEditorsNSData?: boolean;
  removeEmptyAttrs?: boolean;
  removeHiddenElems?: boolean;
  removeEmptyText?: boolean;
  removeEmptyContainers?: boolean;
  cleanupIDs?: boolean;
  minifyStyles?: boolean;
  convertColors?: {
    currentColor?: boolean;
    names2hex?: boolean;
    rgb2hex?: boolean;
  };
}

export interface SpriteOptions {
  format: 'svg' | 'png';
  optimize?: boolean;
  spacing?: number;
  layout?: 'horizontal' | 'vertical' | 'grid';
}
