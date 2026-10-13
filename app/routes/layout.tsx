import type { Route } from "./+types/layout";
import style from "css/layout.module.css";
import { Outlet, Link, NavLink } from "react-router";
import { LINKS } from "~/data/links";
import { IoMenu, IoClose } from "react-icons/io5";
import { publicAsset } from "~/lib/publicAsset";

const logoSrc = publicAsset("/images/Brand Kit/Logo/SVG/Blazium_Logo.svg");

export const Header = () => {
  return (
    <header className={style["header"]}>
      <nav>
        <Link to="/">
          <img src={logoSrc} alt="Blazium Logo" height={24} width={24} />
          <span>Blazium</span>
        </Link>
        <div>
          <NavLink to="/download">Download</NavLink>
          <NavLink to="/features">Features</NavLink>
          <NavLink to="/news">News</NavLink>
        </div>
      </nav>
      <nav>
        <Link to={LINKS.documentation}>Documentation</Link>
      </nav>
      <button className="secondary" popoverTarget="mobile-menu" popoverTargetAction="show">
        <IoMenu />
      </button>
      <dialog id="mobile-menu" popover="manual" key={new Date().getMilliseconds()}>
        <button className="secondary" popoverTarget="mobile-menu" popoverTargetAction="hide">
          <IoClose />
        </button>
        <nav>
          <Link to="/">
            <img src={logoSrc} alt="Blazium Logo" height={24} width={24} />
            <span>Blazium</span>
          </Link>
          <hr />
          <NavLink to="/download">Download</NavLink>
          <NavLink to="/features">Features</NavLink>
          <NavLink to="/news">News</NavLink>
        </nav>
        <hr />
        <nav>
          <span>Learn More</span>
          <Link to={LINKS.documentation}>Documentation</Link>
          <Link to="/chat">Discord</Link>
          <Link to={LINKS.twitter}>X/Twitter</Link>
          <Link to={LINKS.github}>GitHub</Link>
          <Link to="/developers">Developers</Link>
          <Link to="/changelog">Changelog</Link>
        </nav>
      </dialog>
    </header>
  )
}

export const Footer = () => {
  return (
    <footer className={style["footer"]}>
      <nav>
        <div>
          <h2>Get Started</h2>
          <Link to="/download">Download</Link>
          <Link to="/features">Features</Link>
          <Link to={LINKS.documentation}>Documentation</Link>
          <Link to="/changelog">Changelog</Link>
        </div>
        <div>
          <h2>Resources</h2>
          <Link to="/news">News</Link>
          <Link to="/sponsors">Sponsors</Link>
          <Link to="/developers">Developers</Link>
          <Link to="/brand-kit">Brand Kit</Link>
        </div>
        <div>
          <h2>Follow Us</h2>
          <Link to="https://blazim.app/chat">Discord</Link>
          <Link to={LINKS.github}>GitHub</Link>
          <Link to={LINKS.indiedb}>IndieDB</Link>
          <Link to={LINKS.twitter}>X/Twitter</Link>
          <Link to={LINKS.youtube}>YouTube</Link>
          <Link to={LINKS.itchio}>itch.io</Link>
        </div>
      </nav>
      <small>
        {import.meta.env.DEV ? "DEV" : import.meta.env["VITE_GITHUB_PAGES"] ? "GH_PAGES" : "PROD"}
        {" | "}
        <Link to={`${LINKS.website_repo}/blob/master/LICENSE`}>
          MIT {new Date().getFullYear()} Blazium Games & contributors.
        </Link>
      </small>
    </footer>
  )
}

export default ({ }: Route.ComponentProps) => {
  return <>
    <Header />
    <Outlet />
    <Footer />
  </>
}