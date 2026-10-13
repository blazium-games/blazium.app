import { Link } from "react-router";
import type { Route } from "./+types/features";
import style from "css/features.module.css";
import { MetaTags } from "comps/metatags";
import { featuresList } from "data/features";
import { publicAsset } from "~/lib/publicAsset";

export async function markdown() {
  const content = 
`> For an index of all blazium.app content, see [/llms.txt](/llms.txt).

# Features of the Blazium Engine

${Object.entries(featuresList).map(([title, features]) => 
`## ${title}

${features.map(feature =>
`### ${feature.title}
${feature.img && `\n![](${feature.img})\n`}
${feature.description}${feature.links ? `\n${feature.links.map(link => `- [${link.label}](${link.url})`).join("\n")}` : ""}
`
).join("\n")}
`
).join("")}
`;
  return content;
}

export default ({ }: Route.ComponentProps) => {
  return <>
    <MetaTags
      title="Features"
      description="From games to applications, Blazium Engine gives you everything you need to start, ship, grow and stand out from the crowd."
    />
    <main className={style["main"]}>
      <hgroup>
        <h1>Features</h1>
        <p>
          From games to applications, Blazium Engine gives you everything
          you need to start, ship, grow and stand out from the crowd.
        </p>
        <img src={publicAsset("/images/editor.webp")} alt="" />
      </hgroup>
      <section>
        <aside>
          <h2>Features</h2>
          <ul>
            {Object.entries(featuresList).map(([title, features]) => (
              <li key={title}>
                <details name="features-nav">
                  <summary className="button secondary">{title}</summary>
                  <nav>
                    <ul>
                      {features.map(feature =>
                        <li key={feature.title}>
                          <Link to={`#${feature.title.toLowerCase().replaceAll(" ", "_")}`}>{feature.title}</Link>
                        </li>
                      )}
                    </ul>
                  </nav>
                </details>
              </li>
            ))}
          </ul>
        </aside>
        {Object.entries(featuresList).map(([title, features]) => (
          <section key={title} id={title}>
            <h2>{title}</h2>
            {features.map(feature => (
              <article key={feature.title} id={feature.title.toLowerCase().replaceAll(" ", "_")}>
                <h3>{feature.title}</h3>
                {feature.img &&
                  <img src={feature.img || publicAsset("/images/social.png")} alt={feature.title} loading="lazy" />
                }
                <p>{feature.description}</p>
                {feature.links &&
                  <nav>
                    <ul>
                      {feature.links.map(link =>
                        <li key={link.url}>
                          <Link to={link.url} className="button secondary">{link.label}</Link>
                        </li>
                      )}
                    </ul>
                  </nav>
                }
              </article>
            ))}
          </section>
        ))}
      </section>
    </main>
  </>
}