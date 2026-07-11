import { defineConfig } from "rolldown";
import Raw from "unplugin-raw/rolldown";
import build from "./scripts/build";

export default defineConfig((config) => {
  const minify = config.watch ? false : true;
  build();
  return [
    {
      input: "src/content.ts",
      output: {
        dir: "dist",
        minify: minify,
      },
      plugins: [Raw()],
    },
    {
      input: "src/background.ts",
      output: {
        dir: "dist",
        minify: minify,
      },
      plugins: [Raw()],
    },
  ];
});
