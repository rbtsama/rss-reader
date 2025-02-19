import type { RssSource } from '../types/rss'

const RSS_SOURCES_KEY = 'rss_sources'

export const storage = {
  getRssSources(): RssSource[] {
    const sources = localStorage.getItem(RSS_SOURCES_KEY)
    return sources ? JSON.parse(sources) : []
  },

  saveRssSources(sources: RssSource[]): void {
    localStorage.setItem(RSS_SOURCES_KEY, JSON.stringify(sources))
  },

  addRssSource(source: RssSource): void {
    const sources = this.getRssSources()
    sources.push(source)
    this.saveRssSources(sources)
  },

  updateRssSource(source: RssSource): void {
    const sources = this.getRssSources()
    const index = sources.findIndex(s => s.id === source.id)
    if (index > -1) {
      sources[index] = source
      this.saveRssSources(sources)
    }
  },

  deleteRssSource(id: string): void {
    const sources = this.getRssSources()
    const index = sources.findIndex(s => s.id === id)
    if (index > -1) {
      sources.splice(index, 1)
      this.saveRssSources(sources)
    }
  }
} 