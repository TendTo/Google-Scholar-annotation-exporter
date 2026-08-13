import { defineConfig } from "rolldown";
import Raw from "unplugin-raw/rolldown";
import build from "./scripts/build";
import path from "path";
import fs from "fs";

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
      plugins: [
        Raw(),
        {
          name: "handlebars-and-html-watcher",
          buildStart() {
            fs.globSync(path.join(__dirname, "/src/**/*.{html,hbs}")).forEach(
              this.addWatchFile.bind(this),
            );
          },
          watchChange(id) {
            if (id.endsWith(".hbs")) build();
          },
        },
      ],
    },
    {
      input: "src/background.ts",
      output: {
        dir: "dist",
        minify: minify,
      },
      plugins: [Raw()],
    },
    {
      input: "src/sandbox.ts",
      output: {
        dir: "dist",
        minify: minify,
      },
      plugins: [Raw()],
    },
    {
      input: "src/offscreen.ts",
      output: {
        dir: "dist",
        minify: minify,
      },
      plugins: [Raw()],
    },
  ];
});
