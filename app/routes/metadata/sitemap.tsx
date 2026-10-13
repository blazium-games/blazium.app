import type { ArticlesIndex } from "~/types";
import type { Route } from "../metadata/+types/sitemap";

type sitemapFreq = (
  "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never"
);

type sitemapURL = {
  loc: string;
  lastmod?: string;
  changefreq?: sitemapFreq;
  priority?: number;
}

const urls: sitemapURL[] = [{
  loc: "/",
  changefreq: "yearly",
  priority: 1.0,
}, {
  loc: "/features",
  changefreq: "monthly",
  priority: 0.9,
}, {
  loc: "/download",
  changefreq: "monthly",
  priority: 0.9,
}, {
  loc: "/download/editor",
  changefreq: "weekly",
  priority: 0.8,
}, {
  loc: "/download/hub",
  changefreq: "weekly",
  priority: 0.8,
}, {
  loc: "/download/cli",
  changefreq: "weekly",
  priority: 0.8,
}, {
  loc: "/news",
  changefreq: "weekly",
  priority: 0.8,
}, {
  loc: "/changelog",
  changefreq: "weekly",
  priority: 0.7,
}, {
  loc: "/developers",
  changefreq: "monthly",
  priority: 0.7,
}, {
  loc: "/sponsors",
  changefreq: "yearly",
  priority: 0.7,
}, {
  loc: "/brand-kit",
  changefreq: "yearly",
  priority: 0.6,
}, {
  loc: "/llms.txt",
  changefreq: "monthly",
  priority: 0.9,
}, {
  loc: "/sitemap.xml",
  changefreq: "monthly",
  priority: 0.9,
}, {
  loc: "/humans.txt",
  changefreq: "monthly",
  priority: 0.9,
}];

function makeurl(url: sitemapURL) {
  let content = "<url>";
  content += `<loc>https://blazium.app${url.loc}</loc>`;

  if (url.lastmod) content += `<lastmod>${url.lastmod}</lastmod>`;
  if (url.changefreq) content += `<changefreq>${url.changefreq}</changefreq>`;
  if (url.priority) content += `<priority>${url.priority.toFixed(2)}</priority>`;

  return content + "</url>";
}

export async function loader({ }: Route.LoaderArgs) {
  const response = await fetch(`https://cdn.blazium.app/articles/index.json`);
  const index: ArticlesIndex = await response.json();
  const news = index.items.map(entry => {
    const url: sitemapURL = {
      loc: `/news/${entry.slug}`,
      lastmod: entry.date,
    };
    return makeurl(url);
  }).join("");

  const content = 
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(url => makeurl(url)).join("")}
${news}
</urlset>
`

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
    },
  });
}