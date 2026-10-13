import type { Route } from "./+types/changelog";
import style from "css/changelog.module.css";
import { MetaTags } from "comps/metatags";
import { Link, useFetcher } from "react-router";
import { getBuildsData, getVersions } from "~/components/builds_data.server";
import type { BuildType } from "~/types";
import { LINKS } from "~/data/links";
import { serverOnly$ } from "vite-env-only/macros";

export const markdown = serverOnly$(async () => {
  const data = await getBuildsData();
  const content =
`> For an index of all blazium.app content, see [/llms.txt](/llms.txt).

# Blazium Engine changelog

## Release Builds

${data.release.map(entry =>
`- [${entry.version}](${entry.changelog_url})`
).join("\n")}

## Nightly Builds

${data.nightly.map(entry =>
      `- [${entry.version}](${entry.changelog_url})`
    ).join("\n")}
`;
  return content;
});

async function getChangelogData(buildType: BuildType, version?: string) {
  const data = await getBuildsData();
  const versions = getVersions(data, buildType);
  const v = version ?? versions[0] ?? "";

  const response = await fetch(`https://cdn.blazium.app/${buildType}/${v}/changelog.txt`);

  if (!response.ok) return null;

  const text = await response.text();

  const commitsSHA = text.match(/Changelog: (?<a>[a-z0-9]{40}) -> (?<b>[a-z0-9]{40})/)?.groups;
  const previousSHA = commitsSHA?.["a"] ?? "";
  const currentSHA = commitsSHA?.["b"] ?? "";

  const totalCommits = text.match(/- Total Commits: (?<a>\d+)/)?.groups?.["a"] ?? 0;
  const totalPRs = text.match(/- Total PRs: (?<a>\d+)/)?.groups?.["a"] ?? 0;
  const totalContributors = text.match(/- Total Contributors: (?<a>\d+)/)?.groups?.["a"] ?? 0;

  const commitsRegEx = /Commit SHA: (?<sha>[a-z0-9]{40})\nDate: (?<date>.+)\nUser: (?<user>[a-zA-Z0-9-]+)\nMessage: (?<message>[\s\S]*?(?=\n))/g;
  const commits = [...text.matchAll(commitsRegEx)].map(commit => ({
    sha: commit.groups?.["sha"] ?? "",
    date: (new Date(commit.groups?.["date"] ?? "")).toISOString(),
    user: commit.groups?.["user"] ?? "",
    message: commit.groups?.["message"] ?? "",
  }));

  const contributors = [...text.matchAll(/- (?<user>[a-zA-Z0-9-]+): (?<n>\d+) contributions/g)].map(contributor => ({
    user: contributor.groups?.["user"] ?? "",
    contributions: contributor.groups?.["n"] ?? "",
  }));

  return {
    versions,
    info: {
      version: v,
      buildType,
      previousSHA,
      currentSHA,
      totalCommits,
      totalPRs,
      totalContributors,
    },
    commits,
    contributors,
  };
}

export async function action({ request }: Route.LoaderArgs) {
  const formData = await request.formData();
  const buildType = formData.get("build_type") as BuildType | null || "release";
  const version = formData.get("version") as string | null || undefined;
  return await getChangelogData(buildType, version);
}

export async function loader({ request }: Route.LoaderArgs) {
  const v = new URL(request.url).searchParams.get("v");
  const buildType = v?.split("_")[0] as BuildType | undefined ?? "release";
  const version = v?.split("_")[1];

  const data = await getChangelogData(buildType, version);

  if (!data) {
    throw new Response(null, { status: 404 });
  }

  return data;
}

function Commit({ data }: { data: any }) {
  const date = new Date(data.date);

  const dateOptions: Intl.DateTimeFormatOptions = {
    dateStyle: "long",
  };

  const datetimeOptions: Intl.DateTimeFormatOptions = {
    dateStyle: "long",
    timeStyle: "long",
  };

  return (
    <article className={style["commit-article"]}>
      <h3>
        Commit <Link to={`${LINKS.engine_repo}/commit/${data.sha}`} target="_blank"><code>
          {data.sha.slice(0, 7)}
        </code></Link> by <Link to={`${LINKS.engine_repo}/commits?author=${data.user}`} target="_blank">
          <img src={`https://github.com/${data.user}.png?size=24`} alt={`${data.user}`} height={24} width={24} loading="lazy" />
          {data.user}
        </Link> &ndash; <time dateTime={data.date} title={date.toLocaleString("en-US", datetimeOptions)}>
          {date.toLocaleDateString("en-US", dateOptions)}
        </time>
      </h3>
      <p>{data.message}</p>
    </article>
  )
}

export default ({ loaderData }: Route.ComponentProps) => {
  const fetcher = useFetcher<typeof action>()
  const data = fetcher.data ?? loaderData;

  return <>
    <MetaTags
      title={`${data.info.buildType} ${data.info.version} changelog`}
      description={`${data.info.totalCommits} commits ${data.info.totalContributors} contributors.`}
    />
    <main className={style["main"]}>
      <h1>Blazium Engine Changelog</h1>
      <aside>
        <fetcher.Form method="POST">
          <label>
            <span>Build Type</span>
            <select
              name="build_type"
              defaultValue={data.info.buildType}
              onChange={(e) => fetcher.submit(e.currentTarget.form, { method: "POST" })}
            >
              <option value="release">release</option>
              <option value="nightly">nightly</option>
            </select>
          </label>
          <label>
            <span>Version</span>
            <select
              name="version"
              defaultValue={data.info.version}
              onChange={(e) => fetcher.submit(e.currentTarget.form, { method: "POST" })}
            >
              {data.versions.map(version => (
                <option key={version} value={version}>{version}</option>
              ))}
            </select>
          </label>
        </fetcher.Form>
      </aside>
      <section>
        <hgroup>
          <h2>Changelog for {data.info.buildType} {data.info.version}</h2>
          <div>
            <Link to={`${LINKS.engine_repo}/compare/${data.info.previousSHA}...${data.info.currentSHA}`}><code>
              {data.info.previousSHA.slice(0, 7)}&hellip;{data.info.currentSHA.slice(0, 7)}
            </code></Link>
            <p><strong>{data.info.totalCommits}</strong> <span>commits</span></p>
            <p><strong>{data.info.totalContributors}</strong> <span>contributors</span></p>
          </div>
        </hgroup>
        <hr />
        {data && data.commits.map(commit => (<Commit key={commit.sha} data={commit} />))}
      </section>
    </main>
  </>
}