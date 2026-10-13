import type { Route } from "./+types/sponsors";
import style from "css/sponsors.module.css";
import { MetaTags } from "comps/metatags";
import { Link } from "react-router";
import { sponsors } from "data/sponsors";
import { publicAsset } from "~/lib/publicAsset";

export async function markdown() {
  const content =
`> For an index of all blazium.app content, see [/llms.txt](/llms.txt).

# Sponsors of Blazium Games

${sponsors.map(s => `- [${s.name}](${s.url})`).join("\n")}

> If you are interested in a sponsorship, please write to <mailto:business@divine.games>
`;
  return content;
}

export default ({ }: Route.ComponentProps) => {
  return <>
    <MetaTags
      title="Sponsors of Blazium Games"
    />
    <main className={style["main"]}>
      <h1>Sponsors of Blazium Games</h1>
      <section>
        {sponsors.map(s => (
          <Link key={s.name} to={s.url} title={s.name} target="_blank">
            <img src={publicAsset(`images/sponsors/${s.img}`)} alt={s.name} />
          </Link>
        ))}
      </section>
      <p>
        If you are interested in a sponsorship,
        please write to <Link to="mailto:business@divine.games">business@divine.games</Link>
      </p>
    </main>
  </>
}