import { rolldown } from "rolldown";
import { join } from "node:path";
const here = import.meta.dirname;
const bundle = await rolldown({
  input: join(here, "..", "src", "spike", "worker.ts"),
  platform: "neutral",
  external: /^node:/,
  resolve: { conditionNames: ["workerd", "worker", "browser", "import", "default"] },
  logLevel: "silent",
});
await bundle.write({ file: process.argv[2]!, format: "esm", codeSplitting: false });
await bundle.close();
