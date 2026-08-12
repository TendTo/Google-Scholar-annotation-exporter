import Handlebars from "handlebars";
import fs from "fs";

function precompileTemplates() {
  // List all files in the src/templates directory that end with .hbs
  const FORMATS = fs
    .readdirSync("src/templates")
    .filter((file) => file.endsWith(".hbs"))
    .map((file) => file.replace(".hbs", ""));
  // For each format, read the template file, precompile it, and write the precompiled template to a .hbs.js file
  for (const f of FORMATS) {
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
  }
}

export default function () {
  precompileTemplates();
}
