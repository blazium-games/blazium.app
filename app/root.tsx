import type { Route } from "./+types/root";
import "./app.css";
import {
  isRouteErrorResponse,
  Links,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { isbot } from "isbot";
import { publicAsset } from "~/lib/publicAsset";

export default ({ loaderData }: Route.ComponentProps) => {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="creator" content="Nicholas Santos Shiden (sshiiden)" />
        <meta name="publisher" content="Blazium Games" />
        <meta name="robots" content="index, follow" />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        <meta name="application-name" content="Blazium Game Engine" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="blazium.app" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content={loaderData.url} />
        <meta name="twitter:url" content={loaderData.url} />
        <meta name="twitter:creator" content="@BlaziumGames" />
        <meta name="theme-color" content="#140c25" />
        <link rel="icon" href={publicAsset("/favicon.ico")} type="image/x-icon" />
        <link rel="canonical" href={loaderData.url} />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  url.protocol = "https:";
  url.search = "";
  url.hash = "";
  return {
    isBot: isbot(request.headers.get("user-agent")),
    url: url.href,
  };
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    const isNotFound = error.status === 404;
    return (
      <main id="error-container">
        <h2>
          {isNotFound ? "Page not found" : "Error"}
        </h2>
        <p>{
          isNotFound ?
            "The page you're looking for has been deleted, or never existed in the first place." :
            error.statusText || "An unexpected error occurred."
        }</p>
      </main>
    );
  } else if (error && error instanceof Error) {
    return (<>
      {error.stack && (
        <pre>
          <code>{error.stack}</code>
        </pre>
      )}
    </>);
  }
}
