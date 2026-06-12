import type { ToolManifest } from "~/types";

export async function getLatestToolData(toolName: "cli" | "hub") {
  const response = await fetch(`https://cdn.blazium.app/catalog/tools/${toolName}/manifest.json`);

  if (!response.ok) {
    return null;
  }

  const resData: ToolManifest = await response.json();
  const latestVersion = resData["latest"];
  const latestVersionData = resData["versions"][latestVersion];

  return {
    version: latestVersion,
    ...latestVersionData,
  };
}