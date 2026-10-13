import type { Route } from "./+types/news";
import style from "css/news.module.css";
import { MetaTags } from "comps/metatags";
import type { ArticleIndexData, ArticlesIndex } from "~/types";
import { Link } from "react-router";
import { FaRss } from "react-icons/fa6";

export async function loader({ }: Route.LoaderArgs) {
  const response = await fetch(`https://cdn.blazium.app/articles/index.json`);

  if (!response.ok) {
    return null;
  }

  const index: ArticlesIndex = await response.json();
  return index;
}

export async function markdown() {
  const index = await loader({} as Route.LoaderArgs);
  const content = 
`> For an index of all blazium.app content, see [/llms.txt](/llms.txt).

# The latest Blazium Games news

${index?.items.map(entry => `- [${entry.title}](/news/${entry.slug}): ${entry.description}`).join("\n")}
`;
  return content;
}

export function ArticleCard({ data }: { data: ArticleIndexData }) {
  return (
    <article className={style["article"]}>
      <Link to={`/news/${data.slug}`}>
        <img src={data.cover} alt={data.slug} loading="lazy" />
      </Link>
      <Link to={`/news/${data.slug}`}><h2>{data.title}</h2></Link>
      <p>{truncateText(data.description, 120)}</p>
      <time dateTime={data.date}>{
        new Date(data.date).toLocaleDateString("en-US", { dateStyle: "long" })
      }</time>
    </article>
  )
}

function truncateText(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

export default ({ loaderData }: Route.ComponentProps) => {
  return <>
    <MetaTags
      title="News"
      description={`${loaderData?.count} news articles about Blaizum Games.`}
    />
    <main className={style["main"]}>
      <h1>News</h1>
      <Link to="https://cdn.blazium.app/articles/rss.xml" className="button secondary"><FaRss />RSS</Link>
      {loaderData?.items.map(entry => <ArticleCard key={entry.slug} data={entry} />)}
    </main>
  </>
}