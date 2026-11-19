import { BAYER_GLSL } from "../bayer";
import { type GlslPass, glslFloat } from "../contract";
import type { OrderedParams } from "./ordered";

/** The threshold of step `[o, s]`, written as the original shaders wrote it. */
function glslThreshold(o: number, s: number): string {
  if (o === 0 && s === 1) return "t";
  if (s === 1) return `${glslFloat(o)}+t`;
  if (o === 0) return `t*${glslFloat(s)}`;
  return `${glslFloat(o)}+t*${glslFloat(s)}`;
}

export const orderedGlsl: GlslPass<OrderedParams> = {
  type: "ordered",
  kind: "cell",
  usesCell: true,
  glsl(p) {
    const n = p.matrix;
    const at = p.origin === "top" ? "vec2(cell.x,uCells.y-1.-cell.y)" : "cell";
    const half = p.centered ? `+${glslFloat(0.5 / (n * n))}` : "";
    let test = "";
    for (let k = p.steps.length - 1; k >= 0; k--) {
      const [o, s] = p.steps[k] ?? [0, 1];
      test = `if(v>${glslThreshold(o, s)}){k=${glslFloat(k + 1)};${test}}`;
    }
    return {
      decl: [BAYER_GLSL],
      body: `{float t=bayer${n}(${at})${half};float v=c.r;float k=0.;${test}c=vec4(k,0.,0.,1.);}`,
    };
  },
};
