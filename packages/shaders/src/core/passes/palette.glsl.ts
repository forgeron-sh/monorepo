import type { GlslPass } from "../contract";
import type { PaletteParams } from "./palette";

export const paletteGlsl: GlslPass<PaletteParams> = {
  type: "palette",
  kind: "cell",
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
};
