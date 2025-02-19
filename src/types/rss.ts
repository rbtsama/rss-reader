export interface RssSource {
  id: string;
  name: string;
  type: string;
  url: string;
  isSubscribed: boolean;
}

export interface RssItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  sourceId: string;
}

export interface RssConfig {
  timeout: number; // 请求超时时间(ms)
  maxContentLength: number; // 最大内容长度
}

export const DEFAULT_RSS_CONFIG: RssConfig = {
  timeout: 10000, // 10秒超时
  maxContentLength: 500000 // 限制内容大小
}; 