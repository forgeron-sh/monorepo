// The Node modules a bundle imports. The neutral entry point of `@forgeron/sdk` must import none:
// a tool's Worker runs in workerd (docs/ARCHITECTURE.md, "Packages").
import { builtinModules } from "node:module";
import { rolldown } from "rolldown";

const isNode = (specifier: string) =>
  specifier.startsWith("node:") || builtinModules.includes(specifier);

/** Bundles `entry` as the Worker would see it, and lists the Node modules it still imports. */
export async function nodeImportsOf(entry: string): Promise<string[]> {
  const bundle = await rolldown({
    input: entry,
    platform: "neutral",
    logLevel: "silent",
    // Left as imports instead of failing to resolve, so that they can be reported.
    external: [/^node:/, ...builtinModules],
  });
  const { output } = await bundle.generate({ format: "esm" });
  await bundle.close();
  const specifiers = output.flatMap((chunk) =>
    chunk.type === "chunk" ? [...chunk.imports, ...chunk.dynamicImports] : [],
  );
  return [...new Set(specifiers.filter(isNode))].sort();
}
