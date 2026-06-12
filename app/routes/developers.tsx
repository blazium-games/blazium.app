import type { Route } from "./+types/developers";
import style from "css/developers.module.css";
import { MetaTags } from "comps/metatags";
import type { Developer } from "~/types";
import { developers } from "~/data/developers";
import { publicAsset } from "~/lib/publicAsset";

const DEVS = developers.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

export async function markdown() {
  const content = 
`> For an index of all blazium.app content, see [/llms.txt](/llms.txt).

# Blazium Games

We are a group of passionate programmers and artists driven by our love of videogames.

${DEVS.map(dev =>
`## ${dev.name} (${dev.roles.join(", ")})\n` +
`${dev.altName ? `\nAlso known as: ${dev.altName}\n` : ""}` +
`${dev.image ? `\n![](${dev.image})\n` : ""}`
).join("\n")}
`;
  return content;
}

function DevCard({ data }: { data: Developer }) {
  return (
    <article className={style["devcard-article"]} title={data.name}>
      <img
        src={data.image ?? publicAsset("images/developers/placeholder.svg")}
        alt={`${data.name}`}
      />
      <hgroup>
        <h2>{data.name}</h2>
        {data.altName && <span>{data.altName}</span>}
      </hgroup>
      <ol>{data.roles.map(role => <li key={role}><small>{role}</small></li>)}</ol>
    </article>
  )
}

export default ({ }: Route.ComponentProps) => {
  return <>
    <MetaTags
      title="Blazium Games Team"
      description="We are a group of passionate programmers and artists driven by our love of videogames."
    />
    <main className={style["main"]}>
      <h1>Blazium Games</h1>
      <p>We are a group of passionate programmers and artists driven by our love of videogames.</p>
      <section>
        {DEVS.map(dev => <DevCard key={dev.name} data={dev} />)}
      </section>
    </main>
  </>
}