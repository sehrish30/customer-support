import { WEB_SEARCH_MAX_RESULTS } from '../constants.js';
import type { WebSource } from '../types.js';

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilyResult[];
}

export async function searchWeb(query: string): Promise<WebSource[]> {
  console.log(`[WebSearch] Query: ${query}`);
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.error('[WebSearch] TAVILY_API_KEY is not configured.');
    return [];
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: WEB_SEARCH_MAX_RESULTS,
        search_depth: 'basic',
      }),
    });

    if (!response.ok) {
      console.error('[WebSearch] Tavily API error:', response.status, await response.text());
      return [];
    }

    const data = (await response.json()) as TavilyResponse;
    if (!data.results || data.results.length === 0) {
      console.log('[WebSearch] No results found.');
      return [];
    }

    console.log(`[WebSearch] Retrieved ${data.results.length} results.`);
    return data.results.map((r) => ({
      type: 'web' as const,
      title: r.title,
      url: r.url,
      snippet: r.content,
    }));
  } catch (err) {
    console.error('[WebSearch] Error:', err);
    return [];
  }
}
