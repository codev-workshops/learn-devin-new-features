import { createDb } from "../db.js";
import { generateDataset } from "./generate.js";
import { isSeeded, loadDataset, resetSchema, summarize } from "./load.js";
import { loadSeedSpec } from "./spec.js";

const args = new Set(process.argv.slice(2));
const reset = args.has("--reset");
const verifyOnly = args.has("--verify");

async function main(): Promise<void> {
  const spec = loadSeedSpec();
  const db = createDb(undefined, 2);
  try {
    if (verifyOnly) {
      console.log(JSON.stringify(await summarize(db.pool, new Date(spec.as_of)), null, 2));
      return;
    }
    const ds = generateDataset(spec);
    const result = await db.withTransaction(async (client) => {
      await client.query("LOCK TABLE brands IN ACCESS EXCLUSIVE MODE");
      if (await isSeeded(client)) {
        if (!reset) return "already seeded (pass --reset to rebuild)";
        await resetSchema(client);
      }
      await loadDataset(client, ds);
      return `seeded dataset ${spec.seed} as of ${spec.as_of}`;
    });
    console.log(result);
    console.log(JSON.stringify(await summarize(db.pool, ds.asOf)));
  } finally {
    await db.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
