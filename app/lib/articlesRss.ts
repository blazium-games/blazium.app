import type { ArticleIndexData, ArticlesIndex } from "~/types";

export const ARTICLES_RSS_URL = "https://cdn.blazium.app/articles/rss.xml";

function decodeXml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function tag(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  if (!match) return "";
  const value = match[1];
  if (value === undefined) return "";
  return decodeXml(value.trim());
}

function slugFromMetaLink(link: string): string {
  return link.match(/\/articles\/([^/]+)\/meta\.json$/)?.[1] ?? "";
}

export function parseArticlesRss(xml: string): ArticlesIndex {
  const items: ArticleIndexData[] = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map((match): ArticleIndexData | null => {
      const block = match[1];
      if (!block) return null;
      const link = tag(block, "link");
      const enclosure = block.match(/<enclosure\b[^>]*\burl="([^"]+)"/)?.[1] ?? "";
      return {
        slug: slugFromMetaLink(link),
        title: tag(block, "title"),
        description: tag(block, "description"),
        cover: decodeXml(enclosure),
        date: tag(block, "pubDate"),
        hosts: [] as ArticleIndexData["hosts"],
        link,
        guid: tag(block, "guid"),
      };
    })
    .filter((item): item is ArticleIndexData => item !== null && item.slug.length > 0);

  return {
    generated_at: tag(xml, "lastBuildDate"),
    count: items.length,
    items,
  };
}

export async function loadArticles(): Promise<ArticlesIndex | null> {
  const response = await fetch(ARTICLES_RSS_URL);
  if (!response.ok) return null;
  return parseArticlesRss(await response.text());
}
