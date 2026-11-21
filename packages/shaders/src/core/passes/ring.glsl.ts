import { BAYER_GLSL } from "../bayer.glsl";
import { type GlslPass, glslFloat } from "../contract";
import type { RingParams } from "./ring";

export const ringGlsl: GlslPass<RingParams> = {
  type: "ring",
  kind: "cell",
  usesCell: true,
  glsl(p) {
    const n = p.matrix;
    const t = p.tones;
    if (!t.length) return { decl: [], body: "" };
    const age =
      `float a=uTime-${glslFloat(p.start)};` +
      (p.repeat > 0 ? `a=mod(a,${glslFloat(p.repeat)});` : "");
    const pick = t.map((v, i) => `if(ti==${glslFloat(i)})tn=${glslFloat(v)};`).join("");
    const life = glslFloat(p.life);
    return {
      decl: [BAYER_GLSL],
      body:
        `{${age}if(a>=0.&&a<${life}){vec2 q=vec2(cell.x,uCells.y-1.-cell.y);` +
        `float d=length(q+.5-vec2(${glslFloat(p.cx)},${glslFloat(p.cy)})*uCells);` +
        `float k=1.-abs(d-a*${glslFloat(p.speed)}*uCells.x)/${glslFloat(p.width)};` +
        `float th=bayer${n}(q)+${glslFloat(0.5 / (n * n))};` +
        `if(k>0.&&th<k*(1.-a/${life})){float ti=min(${glslFloat(t.length - 1)},floor(a/${life}*${glslFloat(t.length)}));` +
        `float tn=c.r;${pick}c=vec4(tn,0.,0.,1.);}}}`,
    };
  },
};
