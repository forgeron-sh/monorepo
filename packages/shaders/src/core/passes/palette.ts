import type { ColorRef } from "../color";
import type { PassMeta } from "../contract";

export interface PaletteParams {
  /** One colour per tone index. */
  tones: readonly ColorRef[];
  /** Tone indices drawn transparent (the hearth's background). */
  transparent: readonly number[];
}

/** The site's three tones, with the values of its dark theme as fallbacks. */
export const FIELD_TONES: readonly ColorRef[] = [
  { var: "--bg", fallback: "#0a0a0a" },
  { var: "--ink", fallback: "#ededed" },
  { var: "--accent", fallback: "#ff4f1f" },
];

/** A tone index in `r` becomes its colour. Integer lookup: exact on both sides. */
export const paletteMeta: PassMeta = {
  type: "palette",
  kind: "cell",
  description: "Tone indices to colours.",
  params: {
    tones: { type: "colors", default: FIELD_TONES, description: "One colour per tone index." },
    transparent: {
      type: "indices",
      default: [],
      description: "Tone indices drawn transparent.",
    },
  },
};
