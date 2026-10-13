import type { Route } from "./+types/home";
import style from "css/home.module.css";
import { MetaTags } from "comps/metatags";
import { Link } from "react-router";
import { showcases } from "~/data/showcases";
import { ArticleCard } from "./news";
import { publicAsset } from "~/lib/publicAsset";
import type { ArticlesIndex } from "~/types";
import { SiReadthedocs } from "react-icons/si";
import { IoLogoDiscord } from "react-icons/io5";
import { FaSquareGithub } from "react-icons/fa6";

export async function loader({ }: Route.LoaderArgs) {
  const showcase = showcases[Math.floor(Math.random() * showcases.length)];

  const response = await fetch(`https://cdn.blazium.app/articles/index.json`);

  const index: ArticlesIndex = await response.json();

  return {
    showcase,
    news: index.items.slice(0, 4),
  };
}

export default ({ loaderData }: Route.ComponentProps) => {
  return <>
    <MetaTags />
    <main className={style["main"]} id="main-content">
      <section className={style["above-the-fold"]}>
        <div>
          <h1>
            <span>Blazium Game Engine</span>
            <span>Stable, feature rich and community-driven.</span>
          </h1>
          <p>
            Blazium Engine is a free, open-source fork of Godot for building
            cross-platform 2D and 3D games and applications, with the tools, platform
            integrations, and improvements you need.
          </p>
          <nav>
            <Link to="/download" className="button">Download</Link>
            <Link to="/features" className="button secondary">Features</Link>
          </nav>
        </div>
        <div>
          <video
            src={loaderData.showcase?.video}
            autoPlay
            muted
            loop
            disablePictureInPicture
            playsInline
            id="video-showcase"
            width={640}
            height={360}
          />
          <div>
            <label htmlFor="video-showcase">
              <span>{loaderData.showcase?.name}</span>
              <span>{loaderData.showcase?.credits.join(" \u2022 ")}</span>
            </label>
            {loaderData.showcase?.link && <Link to={loaderData.showcase.link.url}>{loaderData.showcase.link.label}</Link>}
          </div>
        </div>
      </section>
      <section className={style["news"]}>
        <h2>Latest News</h2>
        <Link to="/news" className="button secondary">View All</Link>
        {loaderData.news.map(article => <ArticleCard key={article.slug} data={article} />)}
      </section>
      <section className={style["features"]}>
        <div>
          <span>Blazium Engine Features</span>
          <h2>Everything you need out of the box</h2>
          <p>
            From games to applications, Blazium Engine
            gives you everything you need to start, ship, grow and stand out from
            the crowd. We develop Blazium Engine to help us with our games,
            and we want to help you with yours.
          </p>
          <Link to="/features" className="button">See all features</Link>
        </div>
        <img src={publicAsset("/images/editor.webp")} alt="alt" loading="lazy" />
      </section>
      <section className={style["get-involved"]}>
        <h2>Get Involved</h2>
        <p>
          Help shape the future of Blazium.<br />
          Whether by contributing code, improving the docs, or joining the community.
        </p>
        <ul>
          <li>
            <h3><FaSquareGithub /> GitHub</h3>
            <p>Report bugs, submit pull requests, or explore the source code.</p>
            <Link to="https://github.com/blazium-games/blazium" className="button">View on GitHub</Link>
          </li>
          <li>
            <h3><SiReadthedocs /> Documentation</h3>
            <p>Official documentation, tutorials, and class reference for Blazium Engine.</p>
            <Link to="https://docs.blazium.app" className="button">Read the Docs</Link>
          </li>
          <li>
            <h3><IoLogoDiscord /> Discord</h3>
            <p>Join the community to ask questions, share projects, get help, and stay updated.</p>
            <Link to="https://blazium.app/chat" className="button">Join Discord</Link>
          </li>
        </ul>
      </section>
    </main >
  </>
}