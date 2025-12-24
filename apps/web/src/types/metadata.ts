// Type definitions to replace Next.js MetadataRoute types

export interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export type Sitemap = SitemapEntry[];

export interface Manifest {
  name?: string;
  short_name?: string;
  description?: string;
  start_url?: string;
  display?: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  background_color?: string;
  theme_color?: string;
  icons?: Array<{
    src: string;
    sizes?: string;
    type?: string;
    purpose?: 'any' | 'maskable' | 'monochrome';
  }>;
}

export interface Robots {
  rules?: Array<{
    userAgent?: string;
    allow?: string | string[];
    disallow?: string | string[];
    crawlDelay?: number;
  }>;
  sitemap?: string | string[];
  host?: string;
}

