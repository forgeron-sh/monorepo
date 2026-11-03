import { parseArgs } from "node:util";
import { UsageError, type Io } from "../io";
import { searchCatalog } from "../template";

/** `forgeron catalog search <text>`: the templates of the catalog (`@forgeron/template-*`, sdk.md §18). */
export async function catalog(args: string[], io: Io): Promise<number> {
  const { positionals } = parseArgs({ args, allowPositionals: true, options: {} });
  const [action, ...words] = positionals;
  if (action !== "search" || words.length === 0) {
    throw new UsageError("Usage: forgeron catalog search <text>");
  }
  const text = words.join(" ");
  const entries = await searchCatalog(text);
  if (entries.length === 0) {
    io.log(`No template matches "${text}".`);
    return 0;
  }
  const width = Math.max(...entries.map((e) => e.name.length));
  for (const entry of entries) {
    io.log(`${entry.name.padEnd(width)}  ${entry.version}  ${entry.description}`.trimEnd());
  }
  return 0;
}
