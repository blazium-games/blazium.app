import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import { envOnlyMacros } from "vite-env-only";

const pagesBase = process.env["GITHUB_PAGES"] === "true" ? "/blazium.app-v2/" : "/";

export default defineConfig(() => {
  return {
    base: pagesBase,
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      reactRouter(),
      envOnlyMacros(),
    ],
  }
});
