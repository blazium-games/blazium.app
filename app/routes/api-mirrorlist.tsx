import type { Route } from "./+types/api-mirrorlist";

export async function loader({ params }: Route.LoaderArgs) {
  const versionParts = params.version.split(".");

  if (versionParts.length < 4) {
    return new Response(null, { status: 403, statusText: "Invalid format" });
  }

  const version = versionParts.slice(0, 3).join(".");
  const buildtype = versionParts[3];
  const mono = versionParts[4];

  const response = await fetch(`https://cdn.blazium.app/${buildtype}/${version}/templates.json`);

  if (!response.ok) {
    return new Response(null, { status: 404 });
  }

  const templatesResData = (await response.json())[mono ? "mono" : "base"];
  const timestamp = templatesResData["timestamp"];
  const mirrors = templatesResData["mirrors"];

  const mirrorslist = {
    version,
    timestamp,
    mirrors: mirrors.map((entry: any) => ({ name: entry.name, url: entry.url, checksum: entry.checksum, filesize: entry.filesize })),
  };

  return new Response(JSON.stringify(mirrorslist), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}