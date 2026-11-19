import { type GlslPass, glslFloat } from "../contract";
import { type BlueNoiseParams, blueNoiseTable } from "./blue-noise";

export const blueNoiseGlsl: GlslPass<BlueNoiseParams> = {
  type: "blue-noise",
  kind: "cell",
  usesCell: true,
  glsl(p, id) {
    const name = `${id}mask`;
    const at = p.origin === "top" ? "vec2(cell.x,uCells.y-1.-cell.y)" : "cell";
    let test = "";
    for (let k = p.steps.length - 1; k >= 0; k--) {
      const [o, s] = p.steps[k] ?? [0, 1];
      test = `if(v>${glslFloat(o)}+t*${glslFloat(s)}){k=${glslFloat(k + 1)};${test}}`;
    }
    return {
      decl: [`uniform highp sampler2D ${name};`],
      body: `{float t=texelFetch(${name},ivec2(mod(${at},64.)),0).r;float v=c.r;float k=0.;${test}c=vec4(k,0.,0.,1.);}`,
      bind(set) {
        set.texture(name, "blue-noise", blueNoiseTable);
      },
    };
  },
};
