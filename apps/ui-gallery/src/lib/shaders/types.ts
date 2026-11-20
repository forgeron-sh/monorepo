// The shapes of the Shaders section (`./index.ts` says how it is built). Kept apart so the client
// islands import types only, never the catalogue.

import type { Preset } from "@forgeron/shaders";

/** A step of a preset: its source, or its first pass of a type. */
export interface StepRef {
  on: "source" | "pass";
  type: string;
}

/**
 * One demo. Every effect is a `preset` run by `mountPreset`, except three whose source needs data
 * from the page that a preset cannot carry (a picture, a word in the pixel face, a text): those go
 * through their mount (`image`, `hearth`, `reveal`). `ramp` and `anvil` are static SVG.
 */
export type DemoSpec =
  | {
      kind: "preset";
      preset: Preset;
      /** The step the controls edit (`live`), from its params schema. */
      edit?: StepRef;
      live?: boolean;
      /** A preset drawn under this one: what shows through its transparent tones. */
      under?: Preset;
      /** Drawn as on forgeron.sh's hero: 6 % opacity, screen blend. */
      faint?: boolean;
    }
  | { kind: "ramp"; n: 2 | 4 | 8 }
  | { kind: "anvil"; mode: "dither" | "fade" }
  | { kind: "image"; pixel?: number; gain?: number; raw?: boolean }
  | { kind: "hearth"; text?: string; cell?: number; still?: boolean }
  | { kind: "reveal"; text: string; pixel?: number; duration?: number };

export interface Version {
  title: string;
  /** The settings, as written where it runs. */
  note: string;
  demo: DemoSpec;
}

/** A place where Forgeron draws an example. */
export interface Use {
  site: string;
  place: string;
  settings: string;
}

/** An example a primitive is part of. */
export interface UsedBy {
  slug: string;
  name: string;
  chain: string;
}

export interface Snippet {
  title: string;
  lang: "tsx" | "css" | "shellscript";
  code: string;
}

export interface Option {
  name: string;
  type: string;
  default?: string;
  description: string;
}

/**
 * Two kinds of page: the primitives (one per source and pass of the registry, `SOURCES` and
 * `PASSES`) and the examples (real cases, each a built-in preset).
 */
export type ShaderGroup = "primitive" | "example";

export interface Shader {
  slug: string;
  group: ShaderGroup;
  name: string;
  summary: string;
  /** How it is drawn: `WebGL`, `Canvas 2D`, or for a primitive the sides it has. */
  engine: string;
  /** Where its code lives. */
  home: string;
  /** The chain, `source → pass → …`. */
  chain: string;
  what: string[];
  /** Examples: where Forgeron draws it. */
  uses: Use[];
  /** Primitives: the examples made with it. */
  usedBy: UsedBy[];
  versions: Version[];
  code: Snippet[];
  options: Option[];
}
