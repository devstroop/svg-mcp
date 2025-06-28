import { IconSearchResult, IconData } from '../types/index.js';

export interface IconProvider {
  name: string;
  displayName: string;
  baseUrl: string;
  supportedFormats: string[];
  requiresApiKey: boolean;
  
  search(query: string, limit?: number): Promise<IconSearchResult[]>;
  getIcon(name: string, options?: IconRetrievalOptions): Promise<IconData>;
  getCategories(): Promise<string[]>;
  isAvailable(): Promise<boolean>;
}

export interface IconRetrievalOptions {
  format?: 'svg' | 'png';
  size?: number;
  color?: string;
  style?: string;
}

export abstract class BaseIconProvider implements IconProvider {
  abstract name: string;
  abstract displayName: string;
  abstract baseUrl: string;
  abstract supportedFormats: string[];
  abstract requiresApiKey: boolean;

  protected apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  abstract search(query: string, limit?: number): Promise<IconSearchResult[]>;
  abstract getIcon(name: string, options?: IconRetrievalOptions): Promise<IconData>;
  abstract getCategories(): Promise<string[]>;

  async isAvailable(): Promise<boolean> {
    try {
      // Simple connectivity check
      const response = await fetch(this.baseUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  protected buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'Icons-MCP/1.0.0',
      'Accept': 'application/json',
    };

    if (this.apiKey && this.requiresApiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }
}
