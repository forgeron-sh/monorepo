/**
 * What the home page computes at build time: the example file drawn by the engine, and the size
 * of the library. Node only, like `parts.ts`.
 */
import { formatJson, readBlueprint, type BlueprintFile } from "@forgeron/blueprint/format";
import { library } from "@forgeron/libraries/blueprints";
import { EXAMPLE } from "./example";
import { drawStill, type Still } from "./parts";

/** The example's text, as a file would hold it. */
export const exampleText = (): string => formatJson(EXAMPLE);

/** The example scene at t = 0.6 (the gear turned, a light on), as a static SVG. */
export async function exampleStillAsync(): Promise<Still> {
  const lib = await readBlueprint(EXAMPLE);
  return drawStill(lib, "rack", "A rack of three servers and a gear", { t: 0.6, vars: {} });
}

/** Files, parts, assemblies and scenes of the library. */
export async function libraryCounts(): Promise<{
  files: number;
  parts: number;
  assemblies: number;
  scenes: number;
}> {
  const out = { files: library.length, parts: 0, assemblies: 0, scenes: 0 };
  for (const file of library) {
    const doc = JSON.parse(await file.load()) as BlueprintFile;
    out.parts += Object.keys(doc.parts ?? {}).length;
    out.assemblies += Object.keys(doc.assemblies ?? {}).length;
    out.scenes += Object.keys(doc.scenes ?? {}).length;
  }
  return out;
}
