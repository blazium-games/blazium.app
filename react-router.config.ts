import { copyFileSync, existsSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Config } from "@react-router/dev/config";
import type { ArticlesIndex } from "~/types";

const isPagesPreview = process.env["GITHUB_PAGES"] === "true";
const pagesBase = "/blazium.app-v2/";

const prerender = [
  "/features",
  "/sponsors",
  "/developers",
  "/brand-kit",
  "/features.md",
  "/sponsors.md",
  "/developers.md",
  "/brand-kit.md",
]

const pagesPrerender = [
  ...prerender,
  "/",
  "/download",
  "/download/editor",
  "/download/hub",
  "/download/cli",
  "/changelog",
  "/news",
  "/llms.txt",
  "/sitemap.xml",
  "/download/editor.md",
  "/download/hub.md",
  "/download/cli.md",
  "/changelog.md",
  "/news.md",
];

async function getArticlesSlugs() {
  const response = await fetch(`https://cdn.blazium.app/articles/index.json`);

  if (!response.ok) {
    return [];
  }

  const index: ArticlesIndex = await response.json();
  return index.items.map(article => article.slug);
}

function moveBuildEntry(src: string, dest: string) {
  if (!existsSync(dest)) {
    renameSync(src, dest);
    return;
  }

  if (statSync(dest).isDirectory()) {
    for (const entry of readdirSync(src)) {
      moveBuildEntry(join(src, entry), join(dest, entry));
    }
    rmSync(src, { recursive: true, force: true });
    return;
  }

  rmSync(dest, { force: true });
  renameSync(src, dest);
}

export default {
  ssr: true,
  basename: isPagesPreview ? pagesBase : "/",
  routeDiscovery: { mode: isPagesPreview ? "initial" : "lazy" },
  async prerender() {
    let articlesSlugs = await getArticlesSlugs();
    return [
      ...(isPagesPreview ? pagesPrerender : prerender),
      ...articlesSlugs.map((s) => `/news/${s}`),
      ...(isPagesPreview ? articlesSlugs.map((s) => `/news/${s}.md`) : []),
    ];
  },
  buildEnd(args) {
    if (!isPagesPreview || !args.viteConfig.isProduction) return;

    const clientDir = join(process.cwd(), "build", "client");
    const siteDir = join(clientDir, "blazium.app-v2");
    const indexPath = join(siteDir, "index.html");
    if (!existsSync(indexPath)) return;

    // GitHub Pages project sites already prefix URLs with /repo-name/.
    // Flatten basename output so index.html lives at the artifact root.
    for (const entry of readdirSync(siteDir)) {
      moveBuildEntry(join(siteDir, entry), join(clientDir, entry));
    }
    rmSync(siteDir, { recursive: true, force: true });

    const rootIndex = join(clientDir, "index.html");
    if (existsSync(rootIndex)) {
      copyFileSync(rootIndex, join(clientDir, "404.html"));
    }
  },
  allowedActionOrigins: process.env["NODE_ENV"] === "development" ? [] : [
    "squid-app-bpdbo.ondigitalocean.app",
    "blazium.app",
  ],
} satisfies Config;
