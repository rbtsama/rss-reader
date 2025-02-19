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