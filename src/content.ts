import { batchCollect } from "./collect";
import { loadState } from "./data";
import { updateUI } from "./ui";

async function main() {
  await updateUI();
  const { isMultipageExporting } = await loadState();
  if (isMultipageExporting) await batchCollect(true);
  console.log("'Google Scholar annotation exporter' extension active.");
}

main();
