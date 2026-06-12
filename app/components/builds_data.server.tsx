import type {
  Architecture,
  BuildsData,
  BuildType,
  EditorData,
  OperatingSystem,
  VersionData,
} from "~/types";

const maxAge = 1000 * 60 * 60 * 6; // 6 Hours

var buildsData: BuildsData | null = null;

export async function getBuildsData() {
  if (buildsData !== null && (Date.now() - buildsData.timestamp) <= maxAge) {
    return buildsData;
  }

  buildsData = {
    timestamp: 0,
    release: await getBuildTypeData("release") ?? [],
    nightly: await getBuildTypeData("nightly") ?? [],
  }

  buildsData.timestamp = Date.now();

  return buildsData;
}

export function getVersions(data: BuildsData, type: BuildType) {
  return data[type].map(v => v.version) ?? [];
}

export function getOsList(data: BuildsData, type: BuildType, version: string) {
  return [...new Set(
    data[type]
      .find(v => v.version === version)
      ?.editors
      .map(e => e.os)
  )];
}

export function getArchs(data: BuildsData, type: BuildType, version: string, os: string) {
  return [...new Set(
    data[type]
      .find(v => v.version === version)
      ?.editors
      .filter(e => e.os === os)
      .map(e => e.arch)
      .filter(a => a !== undefined)
  )];
}

export function hasDotnetSupport(data: BuildsData, type: BuildType, version: string, os: string) {
  return data[type]
    .find(v => v.version === version)
    ?.editors
    .filter(e => e.os === os)
    .find(e => e.dotnet !== undefined) !== undefined
}

async function getBuildTypeData(type: BuildType) {
  const response = await fetch(`https://cdn.blazium.app/catalog/versions/${type}.json`);

  if (!response.ok) {
    return null;
  }

  const versionsResData: VersionData[] = await response.json();

  const versions: VersionData[] = [];
  for (const version of sortVersions(versionsResData)) {
    const response = await fetch(version.version_url);

    if (!response.ok) {
      return null;
    }

    const editorsResData: EditorData[] = await response.json();

    const editors: EditorData[] = [];
    for (const editor of editorsResData) {
      const filedata = parseFilename(editor.filename);

      if (!filedata) {
        continue;
      }

      let data = {
        ...editor,
        os: (filedata.os ?? "") as OperatingSystem,
      }
      if (filedata.arch) data.arch = filedata.arch as Architecture;
      if (filedata.dotnet) data.dotnet = filedata.dotnet;

      editors.push(data);
    }

    versions.push({
      ...version,
      editors: editors,
    })
  }

  return versions.filter(v => v.editors.length > 0);
}

function parseFilename(filename: string) {
  const baseMatch = filename.match(/\d_(?<info>.+)\.zip/);
  if (!baseMatch || !baseMatch.groups) return null;

  const { info } = baseMatch.groups;
  if (!info) return null;

  // Web, Android, Horizon OS, PICO OS
  if (info.startsWith("web") || info.startsWith("android")) {
    return {
      os: info,
      arch: undefined,
      dotnet: undefined,
    };
  }

  // macOS
  if (info.startsWith("macos")) {
    return {
      os: "macos",
      arch: undefined,
      dotnet: info.includes("mono"),
    };
  }

  // Windows, Linux
  const matches = info.match(/^(?<os>[a-z]+)(?<dotnet>\.mono)?\.(?<arch>.+)$/);
  if (matches?.groups) {
    return {
      os: matches.groups["os"] ?? null,
      arch: matches.groups["arch"] ?? null,
      dotnet: matches?.groups?.["dotnet"] !== undefined,
    };
  }

  return null;
}

function sortVersions(versions: VersionData[]) {
  return [...versions].sort((a, b) => {
    const aParts = a.version.split('.').map(Number);
    const bParts = b.version.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const diff = (bParts[i] ?? 0) - (aParts[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}