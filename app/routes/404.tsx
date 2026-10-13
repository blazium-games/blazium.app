import type { Route } from "./+types/404";
import style from "css/404.module.css";
import { MetaTags } from "comps/metatags";
import { Link } from "react-router";
import { LINKS } from "~/data/links";
import { redirect } from "react-router";

const HTTPCodes = {
  "Found": 302,
  "See Other": 303,
  "Permanent Redirect": 308,
}

// Redirects for legacy paths, removed pages and discord invite link
const redirectMiddleware: Route.MiddlewareFunction = async ({ params }) => {
  switch (params["*"]) {
    // Discord server
    case "chat":
      return redirect(LINKS.discord, HTTPCodes["See Other"]);

    // Redirect to editor download page,
    // later will be /download/hub when ready
    case "download":
      return redirect("/download/editor", HTTPCodes["Found"]);

    // permanet redirects
    case "blog":
      return redirect("/news", HTTPCodes["Permanent Redirect"]);
    case "meet-the-team":
      return redirect("/developers", HTTPCodes["Permanent Redirect"]);
    case "download/prebuilt-binaries":
    case "download/digital-store":
      return redirect("/download/editor", HTTPCodes["Permanent Redirect"]);
    case "dev-tools/download":
      return redirect("/download/cli", HTTPCodes["Permanent Redirect"]);

    case "what-is-blazium":
    case "games":
    case "games/hangman":
    case "privacy-policy":
    case "terms-of-service":
    case "licenses":
    case "roadmaps":
    case "road-maps":
    case "dev-tools":
    case "dev-tools/blazium-services":
      return redirect("/", HTTPCodes["Found"]);
  }
}

export const middleware: Route.MiddlewareFunction[] = [
  redirectMiddleware,
];

export default ({ }: Route.ComponentProps) => {
  return <>
    <MetaTags
      title="Page Not Found"
      description="You are not supposed to be here..."
      keywords=""
      image=""
    />
    <main className={style["main"]}>
      <h1>404 | Page Not Found</h1>
      <nav>
        <ul>
          <li><Link to="/" className="button secondary">Home</Link></li>
          <li><Link to="/download" className="button secondary">Download</Link></li>
          <li><Link to="/features" className="button secondary">Features</Link></li>
          <li><Link to="/news" className="button secondary">News</Link></li>
          <li><Link to={LINKS.documentation} className="button secondary">Documentation</Link></li>
        </ul>
      </nav>
      <hr />
      <p>
        Found an issue with the website?
        Please open an <Link to={LINKS.website_repo}>issue on GitHub</Link>.
      </p>
    </main>
  </>
}