import { getBuildsData } from "~/components/builds_data.server";
import type { Route } from "./+types/api-versions";
import type { BuildType } from "~/types";

export async function loader({ params }: Route.LoaderArgs) {
  const versionParts = params.version.split("-");

  if (versionParts.length < 2 || versionParts[0] != "versions") {
    return new Response(null, { status: 403, statusText: "Invalid format" });
  }

  const versionType = versionParts[1];

  if (!versionType) {
    return new Response(null, { status: 403, statusText: "Missing buildtype" });
  }

  const buildsData = (await getBuildsData())[versionType as BuildType];

  const builds = buildsData.map(entry => ({
    name: entry.version,
    release_date: new Date(entry.editors[0]?.timestamp ?? "").toLocaleDateString(undefined, {day: "numeric", month: "long", year: "numeric"}),
    release_notes: entry.changelog_url,
  }))

  const map = new Map<string, typeof builds>();

  for (const build of builds) {
    const majorMinor = build.name.split(".").slice(0, 2).join(".");

    if (!map.has(majorMinor)) {
      map.set(majorMinor, []);
    }
    map.get(majorMinor)!.push(build);
  }

  const versions = Array.from(map.entries()).map(([name, releases]) => ({
    name,
    releases,
  }));

  return new Response(JSON.stringify(versions), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}