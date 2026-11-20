// The Shaders section of the gallery, built from @forgeron/shaders:
//
// - Primitives (`./primitives.ts`): one page per source and pass of the registry (`SOURCES`,
//   `PASSES`). Add a step to the package and it gets a page; its options and live controls come
//   from its params schema.
// - Examples (`./examples.ts`): the real cases, each a built-in preset (`builtInPresets()`).
//
// A demo (`./types.ts`, `DemoSpec`) is a preset run by `mountPreset` (`PresetDemo.tsx`), except
// three mounts whose source needs data from the page (`MountDemo.tsx`) and static SVG drawn at
// build time (`ShaderStage.astro`).

import { examplePresets, examples } from "./examples";
import { primitives, refOf } from "./primitives";
import { chainText, hasStep } from "./snippets";
import type { Shader, ShaderGroup } from "./types";

export type { DemoSpec, Shader, ShaderGroup, StepRef } from "./types";

/** The primitives first (the system), then the examples built on them. */
export const shaders: Shader[] = [
  ...primitives.map((p) => ({
    ...p,
    usedBy: examples
      .filter((e) => hasStep(examplePresets[e.slug]!, refOf(p.slug)))
      .map((e) => ({ slug: e.slug, name: e.name, chain: chainText(examplePresets[e.slug]!) })),
  })),
  ...examples.map((e) => ({ ...e, usedBy: [] })),
];

export const SHADER_GROUPS: { id: ShaderGroup; index: string; title: string; note: string }[] = [
  {
    id: "primitive",
    index: "/0.2.1",
    title: "Primitives",
    note: "Every source and pass of @forgeron/shaders",
  },
  {
    id: "example",
    index: "/0.2.2",
    title: "Examples",
    note: "Real cases to reuse, each a built-in preset",
  },
];
