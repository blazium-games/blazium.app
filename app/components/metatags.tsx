import schemaorg_data from "data/schema-org.json";
import { publicAsset } from "~/lib/publicAsset";

type TagsData = {
  title?: string,
  description?: string,
  keywords?: string,
  author?: string,
  image?: string,
  cardType?: "summary_small_image" | "summary_large_image",
}

export const defaults: TagsData = {
  title: "Blazium Game Engine",
  description: "Blazium Engine is a free, open-source fork of Godot for building cross-platform 2D and 3D games and applications, with the tools, platform integrations, and improvements you need.",
  keywords: "blazium, blazium engine, blazium games, godot, godot fork, game engine, open source game engine, oss, free game engine, mit license, gamedev, indie, indie game development, 2d, 3d, xr, cross platform, multiplayer, game services, networking, steam, luau, community driven, free and open source, game development tools, indie studio, blazium.app, godot alternative, open source gamedev, 2d game engine, 3d game engine",
  author: "Blazium Games & contributors",
  image: publicAsset("/images/social.png"),
  cardType: "summary_large_image",
}

export function MetaTags({
  title = defaults.title,
  description = defaults.description,
  keywords = defaults.keywords,
  author = defaults.author,
  image = defaults.image,
  cardType = defaults.cardType,
}: TagsData) {

  return (<>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="author" content={author} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="keywords" content={keywords} />
    <meta property="og:image" content={image} />
    <meta name="twitter:image" content={image} />
    <meta name="twitter:card" content={cardType} />

    <script type="application/ld+json">{JSON.stringify(schemaorg_data)}</script>
  </>);
}