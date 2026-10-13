import type { Route } from "./+types/download-editor";
import style from "css/download-editor.module.css";
import { MetaTags } from "comps/metatags";
import { getArchs, getBuildsData, getOsList, getVersions, hasDotnetSupport } from "~/components/builds_data.server";
import { getIconOS, getPrettyArch, getPrettyOS, type BuildType, type VersionData } from "~/types";
import { Link, useFetcher } from "react-router";
import { digitalStores } from "~/data/stores";
import { Timestamp } from "comps/timestamp";
import { serverOnly$ } from "vite-env-only/macros";

export async function loader({ }: Route.LoaderArgs) {
  const data = await getBuildsData();
  const buildType = "release";
  const versions = getVersions(data, buildType);
  const version = versions[0] ?? "";
  const osList = getOsList(data, buildType, version);
  const os = osList[0] ?? "";
  const archs = getArchs(data, buildType, version, os);
  const arch = archs[0] ?? "";
  const supportsDotnet = hasDotnetSupport(data, buildType, version, os);

  const editor = (
    data[buildType]
      .find(v => v.version === version)
      ?.editors
      .find(editor => editor.os === os && (editor.arch ?? arch) === arch && (editor.dotnet ?? false) === false)
  ) ?? null;

  return {
    buildType,
    version,
    options: {
      versions,
      osList,
      archs,
      supportsDotnet,
    },
    ...editor,
  }
}

export const markdown = serverOnly$(async () => {
  const data = await getBuildsData();

  const makelisting = (data: VersionData[]) => 
`${data.map(entry => 
`### ${entry.version}

- [changelog](${entry.changelog_url})

#### Files

${entry.editors.map(entry => 
`- [${getPrettyOS(entry.os)}${entry.arch ? " " + getPrettyArch(entry.arch) : ""}${entry.dotnet ? " C#" : ""}](${entry.download_url})`
).join("\n")}
`
).join("\n")}`;

  const content = 
`> For an index of all blazium.app content, see [/llms.txt](/llms.txt).

# Download Blazium Engine

## Release Builds

${makelisting(data.release)}
## Nightly Builds

${makelisting(data.nightly)}
---

- [Blazium Hub](/download/hub)
- [Blazium CLI](/download/cli)
`;
  return content;
});

export async function action({ request }: Route.LoaderArgs) {
  const formData = await request.formData();
  const data = await getBuildsData();
  const buildType = formData.get("build_type") as BuildType ?? "release";
  const versions = getVersions(data, buildType);
  const version = versions.find(v => v === formData.get("version")) ?? versions[0] ?? "";
  const osList = getOsList(data, buildType, version);
  const os = osList.find(os => os === formData.get("os")) ?? osList[0] ?? "";
  const archs = getArchs(data, buildType, version, os);
  const arch = archs.find(arch => arch === formData.get("arch")) ?? archs[0] ?? "";
  const supportsDotnet = hasDotnetSupport(data, buildType, version, os);
  const dotnet = supportsDotnet ? (formData.get("dotnet") ?? "no") === "yes" : false;

  const editor = (
    data[buildType]
      .find(v => v.version === version)
      ?.editors
      .find(editor => editor.os === os && (editor.arch ?? arch) === arch && (editor.dotnet ?? false) === dotnet)
  ) ?? null;

  return {
    buildType,
    version,
    options: {
      versions,
      osList,
      archs,
      supportsDotnet,
    },
    ...editor,
  }
}

function SizeSpan({ bytes }: { bytes: number }) {
  const FORMATS = ["Bytes", "KB", "MB", "GB"];

  let i = 0;
  while (1024 <= bytes) {
    bytes /= 1024;
    ++i;
  }

  return (<span>{(i ? bytes.toFixed(1) : bytes) + " " + FORMATS[i]}</span>);
}

export default ({ loaderData }: Route.ComponentProps) => {
  const fetcher = useFetcher<typeof action>()
  const data = fetcher.data ?? loaderData;

  return <>
    <MetaTags
      title="Download Blazium Engine"
      description="Dowload Blazium Engine."
    />
    <main className={style["main"]}>
      <h1>Download Blazium Game Engine</h1>
      <section className={style["download-section"]}>
        <fetcher.Form>
          <fieldset onChange={(e) => fetcher.submit(e.currentTarget.form, { method: "POST" })}>
            <label>
              <span>Release</span>
              <input type="radio" name="build_type" value="release" defaultChecked />
            </label>
            <label>
              <span>Nightly</span>
              <input type="radio" name="build_type" value="nightly" />
            </label>
          </fieldset>
          <fieldset onChange={(e) => fetcher.submit(e.currentTarget.form, { method: "POST" })}>
            <label>
              <span>Version</span>
              <select name="version">
                {data.options.versions.map(version => (
                  <option key={version} value={version}>{version}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Operating System</span>
              <select name="os">
                {data.options.osList.map(os => (
                  <option key={os} value={os}>{getPrettyOS(os)}</option>
                ))}
              </select>
            </label>
            {data.options.archs.length > 0 && (
              <label>
                <span>Architecture</span>
                <select name="arch">
                  {data.options.archs.map(arch => (
                    <option key={arch} value={arch}>{getPrettyArch(arch)}</option>
                  ))}
                </select>
              </label>
            )}
            {data.options.supportsDotnet && (
              <label>
                <span>C# Support</span>
                <select name="dotnet">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>
            )}
          </fieldset>
        </fetcher.Form>
        <div>
          <Link to={data.download_url ?? ""} download className="button">
            {getIconOS(data.os ?? "windows")} Get {data.buildType} {data.version} {data.dotnet && ".NET"}
          </Link>
          <small>
            {data.size && <SizeSpan bytes={data.size} />} &ndash; {data.timestamp && <Timestamp timestamp={data.timestamp} />}
          </small>
        </div>
        <Link to={`/changelog?v=${data.buildType}_${data.version}`} className="button secondary">View Changelog</Link>
        <div>
          <div>
            <h2>Export Templates</h2>
            <p>Used to export your games to all supported platforms.</p>
          </div>
          <ul>
            <li>
              <Link to={`https://cdn.blazium.app/${data.buildType}/${data.version}/Blazium_v${data.version}_export_templates.tpz`} download>
                Get for {data.buildType} {data.version}
              </Link>
            </li>
            <li>
              <Link to={`https://cdn.blazium.app/${data.buildType}/${data.version}/Blazium_v${data.version}_mono_export_templates.tpz`} download>
                Get for {data.buildType} {data.version} .NET
              </Link>
            </li>
          </ul>
        </div>
      </section>
      <section className={style["stores-section"]}>
        <h2>Also On</h2>
        <ul>
          {digitalStores.map(store => (
            <li key={store.name}>
              <Link to={store.download_url} className="button secondary"><store.icon />{store.name}</Link>
            </li>
          ))}
        </ul>
      </section>
      <div className={style["idkhtni-div"]}>
        <section>
          <h2>Blazium Hub</h2>
          <p>Visually manage editor versions and projects in one place.</p>
          <Link to="/download/hub" className="button">Download Blazium Hub</Link>
        </section>
        <section>
          <h2>Blazium CLI</h2>
          <p>Manage and control your editor, projects and more from the terminal or CI/CD.</p>
          <Link to="/download/cli" className="button">Download Blazium CLI</Link>
        </section>
      </div>
    </main>
  </>
}