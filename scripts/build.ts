import Handlebars from "handlebars";
import fs from "fs";

export default function precompileTemplates() {
  // List all files in the src/templates directory that end with .hbs
  fs.readdirSync("src/templates")
    .filter((file) => file.endsWith(".hbs"))
    .map((file) => file.replace(".hbs", ""))
    .forEach((f) => {
      // For each format, read the template file, precompile it, and write the precompiled template to a .hbs.js file
      const template = fs.readFileSync(`src/templates/${f}.hbs`, "utf-8");
      const specification = Handlebars.precompile(template, {
        destName: `${f}.hbs.js`,
        srcName: `${f}.hbs`,
        knownHelpersOnly: true,
        knownHelpers: {
          escapeDoubleQuotes: true,
          escapePipe: true,
          escapeTex: true,
        },
      }) as unknown as { code: string };
      fs.writeFileSync(`src/templates/${f}.hbs.js`, `export default ${specification.code};`);
    });
}
