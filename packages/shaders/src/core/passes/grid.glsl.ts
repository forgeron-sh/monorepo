import { type GlslPass, glslFloat } from "../contract";
import type { GridParams } from "./grid";

export const gridGlsl: GlslPass<GridParams> = {
  type: "grid",
  kind: "present",
  glsl(p) {
    const edge = glslFloat(1 - p.gap);
    return {
      decl: [],
      body: `{vec2 f=fract(frag/uPx);if(uPx>=${glslFloat(p.min)}&&(f.x>${edge}||f.y>${edge}))c=vec4(${glslFloat(p.tone)},0.,0.,1.);}`,
    };
  },
};
