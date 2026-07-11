import Handlebars from "handlebars";
import fs from "fs";

const FORMATS = ["csv", "json", "md"] as const;
function precompileTemplates() {
  for (const f of FORMATS) {
    const template = fs.readFileSync(`src/templates/${f}.hbs`, "utf-8");
    const specification = Handlebars.precompile(template, {
      destName: `${f}.hbs.js`,
      srcName: `${f}.hbs`,
      knownHelpersOnly: true,
      knownHelpers: {
        escapeDoubleQuotes: true,
        escapePipe: true,
      },
    }) as unknown as { code: string };
    fs.writeFileSync(`src/templates/${f}.hbs.js`, `export default ${specification.code};`);
  }
}

export default function () {
  precompileTemplates();
}
