import type { Route } from "./+types/download-hub";
import style from "css/download.module.css";
import { MetaTags } from "comps/metatags";
import { getLatestToolData } from "comps/tools_data.server";
import { Link } from "react-router";
import { getIconOS, getPrettyArch, getPrettyOS } from "~/types";
import { Timestamp } from "comps/timestamp";
import { LINKS } from "~/data/links";
import { publicAsset } from "~/lib/publicAsset";

export async function loader({ }: Route.LoaderArgs) {
  const latestData = await getLatestToolData("hub");
  return latestData;
}

export async function markdown() {
  const latest = await loader({} as Route.LoaderArgs);
  const content = 
`> For an index of all blazium.app content, see [/llms.txt](/llms.txt).

# Download Blazium Hub

Blazium Hub is a free, open-source desktop app that helps you manage your projects and engine versions.

> Blazium Hub is still in early development, issues are expected.

${latest?.downloads?.map(s => 
`- [${s.platform} ${s.arch}](${s.download_url})`
).join("\n")}

> Last updated ${latest?.released_on}

---

- [Blazium CLI](/download/cli)
- [Standalone Editor](/download/editor)
`;
  return content;
}

export default ({ loaderData }: Route.ComponentProps) => {
  return <>
    <MetaTags
      title="Download Blazium Hub"
    />
    <main className={style["main"]}>
      <header>
        <h1>Blazium Hub</h1>
        <p>
          Blazium Hub is a free, open-source desktop app that helps you manage
          your projects and engine versions.
        </p>
        <Link to={`${LINKS.github}/blazium-hub`} className="button secondary">Check on GitHub</Link>
        <img src={publicAsset("/images/hub.webp")} alt="Screenshot of Blazium Hub" />
      </header>
      <section>
        <h2>Download</h2>
        <small>Blazium Hub is still in early development, issues are expected.</small>
        <ul>
          {loaderData?.downloads?.map(data => 
            <li key={data.sha256}>
              <Link download to={data.download_url} className="button">
                {getIconOS(data.platform)}
                {getPrettyOS(data.platform)} {getPrettyArch(data.arch)}
              </Link>
            </li>
          )}
        </ul>
        <small>Last updated <Timestamp timestamp={loaderData?.released_on || ""} /></small>
      </section>
      <nav>
        <Link to="/download/cli" className="button secondary">Blazium CLI</Link>
        <Link to="/download/editor" className="button secondary">Standalone Editor</Link>
      </nav>
    </main>
  </>
}