import type { IconType } from "react-icons";
import { BsHeadsetVr } from "react-icons/bs";
import { FaApple, FaHtml5, FaMeta } from "react-icons/fa6";
import { ImAndroid, ImWindows } from "react-icons/im";
import { PiLinuxLogoFill } from "react-icons/pi";

export type BuildType = "release" | "nightly";

export type OperatingSystem = (
  "linux"
  | "windows"
  | "macos"
  | "darwin"
  | "web"
  | "android"
  | "android.pico"
  | "android.meta"
);

export type Architecture = (
  "x86_64"
  | "x86_32"
  | "64bit"
  | "32bit"
  | "arm64"
  | "arm32"
);

export type BuildsData = {
  /** the number of milliseconds elapsed since midnight, January 1, 1970 Universal Coordinated Time (UTC). */
  timestamp: number,
  release: VersionData[],
  nightly: VersionData[],
}

export type VersionData = {
  deploy_type: BuildType,
  version: string,
  changelog_url: string,
  version_url: string,
  editors: EditorData[],
}

export type EditorData = {
  filename: string,
  download_url: string,
  sha512: string,
  sha256: string,
  size: number,
  timestamp: string,
  os: OperatingSystem,
  dotnet?: boolean,
  arch?: Architecture,
}

export type DevRoles = (
  "Back-End"
  | "Front-End"
  | "Game Dev"
  | "Engine Dev"
  | "Community"
  | "3D Artist"
  | "Music Producer"
  | "Business Management"
  | "Product Management"
);

export type Developer = {
  name: string,
  altName?: string,
  image?: string,
  roles: DevRoles[],
}

export type DigitalStore = {
  name: string,
  download_url: string,
  icon: IconType,
};

export type ShowcaseInfo = {
  video: string;
  name: string;
  credits: string[];
  link?: LabeledLink;
};

export type LabeledLink = {
  url: string;
  label: string;
}

export type Sponsor = {
  name: string,
  url: string,
  img: string,
};

export type FeatureData = {
  img: string,
  title: string,
  description: string,
  links?: LabeledLink[];
};

export type ArticleHost = {
  name: string,
  url: string,
};

export type ArticleIndexData = {
  slug: string,
  title: string,
  description: string,
  cover: string,
  date: string,
  hosts: ArticleHost[],
  link: string,
  guid: string,
};

export type ArticlesIndex = {
  generated_at: string,
  count: number,
  items: ArticleIndexData[],
};

export type ArticleMetadata = {
  slug: string,
  title: string,
  description: string,
  cover: string,
  date: string,
  changes: string,
  author: string,
  hosts: ArticleHost[],
  link: string,
  content_bbcode: string,
  content_md: string,
};

export type ToolManifest = {
  latest: string,
  released_on: string,
  versions: Record<string, {
    released_on: string,
    downloads: {
      platform: OperatingSystem,
      arch: Architecture,
      filename: string,
      download_url: string,
      sig_url: string,
      sha256: string,
      size: number,
      signing: string
    }[],
  }>,
};

export function getPrettyOS(os: OperatingSystem) {
  switch (os) {
    case "android": return "Android";
    case "android.meta": return "Horizon OS";
    case "android.pico": return "PICO OS";
    case "web": return "Web Editor";
    case "macos":
    case "darwin": return "macOS";
    case "windows": return "Windows";
    case "linux": return "Linux";
    default: throw new Error(`Invalid os: ${os satisfies never}`);
  }
}

export function getIconOS(os: OperatingSystem) {
  switch (os) {
    case "android": return <ImAndroid />;
    case "android.meta": return <FaMeta />;
    case "android.pico": return <BsHeadsetVr />;
    case "web": return <FaHtml5 />;
    case "darwin":
    case "macos": return <FaApple />;
    case "windows": return <ImWindows />;
    case "linux": return <PiLinuxLogoFill />;
    default: throw new Error(`Invalid os: ${os satisfies never}`);
  }
}

export function getPrettyArch(arch: Architecture) {
  switch (arch) {
    case "64bit":
    case "x86_64": return "64-bit";
    case "32bit":
    case "x86_32": return "32-bit";
    case "arm64": return "ARM64";
    case "arm32": return "ARM32";
    default: throw new Error(`Invalid arch: ${arch satisfies never}`);
  }
}