import type { Route } from "./+types/article";
import style from "css/article.module.css";
import { MetaTags } from "comps/metatags";
import { marked } from "marked";
import type { ArticleMetadata } from "~/types";
import { LINKS } from "~/data/links";
import { Timestamp } from "comps/timestamp";
import { redirect } from "react-router";

export async function loader({ params }: Route.LoaderArgs) {
  let slug = params.slug;
  const is_md_slug = slug.endsWith(".md");

  if (is_md_slug) slug = slug.slice(0, slug.length - 3);

  const metadataRes = await fetch(`https://cdn.blazium.app/articles/${slug}/meta.json`);

  if (!metadataRes.ok) {
    throw new Response(undefined, { status: 404 });
  }

  const metadata: ArticleMetadata = await metadataRes.json();

  if (is_md_slug) return redirect(metadata.content_md, { status: 302 });

  const contentRes = await fetch(metadata.content_md);

  if (!contentRes.ok) throw new Response(undefined, { status: 404 });

  const content = (
    (await marked.parse(await contentRes.text()))
      .replaceAll(`${LINKS.indiedb}/news/`, "/news/")
      .replaceAll(`${LINKS.indiedb}/features/`, "/news/")
      .replaceAll("https://blazium.app", "")
  );

  return {
    metadata,
    content,
  };
}

export default ({ loaderData }: Route.ComponentProps) => {
  const metadata = loaderData.metadata;
  return <>
    <MetaTags
      title={metadata.title}
      description={metadata.description}
      author={metadata.author}
      image={metadata.cover}
    />
    <main className={style["main"]}>
      <header>
        <img src={metadata.cover} alt={metadata.title} />
        <hgroup>
          <h1>{metadata.title}</h1>
          <span>
            <address>{metadata.author}</address> &ndash; <Timestamp timestamp={metadata.date} />
          </span>
        </hgroup>
        <p>{metadata.description}</p>
      </header>
      <article dangerouslySetInnerHTML={{ __html: loaderData.content }} />
    </main>
  </>
}