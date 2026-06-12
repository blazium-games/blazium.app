import type { Route } from "./+types/dotmd";
import { markdown as news_md } from "../news";
import { markdown as features_md } from "../features";
import { markdown as sponsors_md } from "../sponsors";
import { markdown as brandkid_md } from "../brand-kit";
import { markdown as hub_md } from "../download-hub";
import { markdown as cli_md } from "../download-cli";
import { markdown as editor_md } from "../download-editor";
import { markdown as developers_md } from "../developers";
import { markdown as changelog_md } from "../changelog";

export async function loader({pattern}: Route.LoaderArgs) {
  if (!pattern.endsWith(".md")) return new Response("Not Found", { status: 404 });

  const content = await (() => {
    switch (pattern) {
      case "news.md": return news_md();
      case "features.md": return features_md();
      case "sponsors.md": return sponsors_md();
      case "brand-kit.md": return brandkid_md();
      case "developers.md": return developers_md();
      case "download/hub.md": return hub_md();
      case "download/cli.md": return cli_md();
      case "download/editor.md": return editor_md?.();
      case "changelog.md": return changelog_md?.();
      default: return null;
    }
  })();

  if (!content) throw new Response("Not Found", { status: 404 });

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}