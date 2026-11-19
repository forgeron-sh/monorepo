import { type GlslPass, glslFloat } from "../contract";
import { halftoneConstants, type HalftoneParams } from "./halftone";

export const halftoneGlsl: GlslPass<HalftoneParams> = {
  type: "halftone",
  kind: "cell",
  usesCell: true,
  glsl(p) {
    const [C, S, inv] = halftoneConstants(p).map(glslFloat);
    return {
      decl: [],
      body: `{vec2 q=cell+.5;vec2 r=vec2(q.x*${C}+q.y*${S},q.y*${C}-q.x*${S})*${inv};vec2 d=fract(r)-.5;c=vec4(dot(d,d)<c.r*.5?${glslFloat(p.tone)}:0.,0.,0.,1.);}`,
    };
  },
};
