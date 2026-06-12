import { type RouteConfig, index, prefix, route, layout } from "@react-router/dev/routes";

export default [
  route("llms.txt", "routes/metadata/llmstxt.tsx"),
  route("sitemap.xml", "routes/metadata/sitemap.tsx"),

  ...[
    "download/hub.md",
    "download/cli.md",
    "download/editor.md",
    "news.md",
    "features.md",
    "sponsors.md",
    "developers.md",
    "changelog.md",
    "brand-kit.md",
  ].map(entry => route(entry, "routes/metadata/dotmd.tsx", { id: entry })),

  layout("routes/layout.tsx", [
    index("routes/home.tsx"),

    ...prefix("download", [
      route("editor", "routes/download-editor.tsx"),
      route("hub", "routes/download-hub.tsx"),
      route("cli", "routes/download-cli.tsx"),
    ]),
    ...prefix("news", [
      index("routes/news.tsx"),
      route(":slug", "routes/article.tsx"),
    ]),

    route("features", "routes/features.tsx"),
    route("sponsors", "routes/sponsors.tsx"),
    route("developers", "routes/developers.tsx"),
    route("changelog", "routes/changelog.tsx"),
    route("brand-kit", "routes/brand-kit.tsx"),

    route("*", "routes/404.tsx"),
  ]),

  ...prefix("api", [
    route("mirrorlist/:version.json", "routes/api-mirrorlist.tsx"), // /api/mirrorlist/0.6.0.release.mono.json
    route(":version.json", "routes/api-versions.tsx"), // /api/versions-{buildtype}.json
  ]),
] satisfies RouteConfig;