import type { ColorRef } from "../color";
import type { PassDef } from "../contract";

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
export const palettePass: PassDef<PaletteParams> = {
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
  glsl(p, id) {
    const n = p.tones.length;
    const name = `${id}tones`;
    return {
      decl: [`uniform vec4 ${name}[${n}];`],
      body: `{int i=clamp(int(c.r+.5),0,${n - 1});c=${name}[i];}`,
      bind(set, ctx) {
        const v = new Float32Array(n * 4);
        p.tones.forEach((ref, i) => {
          const c = ctx.resolve(ref);
          v[i * 4] = c[0] / 255;
          v[i * 4 + 1] = c[1] / 255;
          v[i * 4 + 2] = c[2] / 255;
          v[i * 4 + 3] = p.transparent.includes(i) ? 0 : 1;
        });
        set.f4v(name, v);
      },
    };
  },
  cpu(frame, p, ctx) {
    const colors = p.tones.map((ref) => ctx.resolve(ref));
    const last = colors.length - 1;
    const { data } = frame;
    for (let o = 0; o < data.length; o += 4) {
      const i = Math.min(last, Math.max(0, Math.round(data[o] ?? 0)));
      const c = colors[i] ?? [0, 0, 0];
      data[o] = c[0] / 255;
      data[o + 1] = c[1] / 255;
      data[o + 2] = c[2] / 255;
      data[o + 3] = p.transparent.includes(i) ? 0 : 1;
    }
  },
};
