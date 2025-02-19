declare module 'rss-parser' {
  export interface CustomItem {
    media?: {
      $: {
        url: string;
      };
    };
    contentEncoded?: string;
    content?: string;
    description?: string;
    guid?: string;
    isoDate?: string;
  }

  export interface CustomFeed {
    items: CustomItem[];
  }

  export default class Parser {
    constructor(options?: {
      headers?: Record<string, string>;
      customFields?: {
        item?: [string, string][];
      };
      defaultRSS?: number;
    });
    parseURL(url: string): Promise<CustomFeed>;
  }
} 