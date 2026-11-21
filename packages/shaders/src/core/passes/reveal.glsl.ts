import { BAYER_GLSL } from "../bayer.glsl";
import { type GlslPass, glslFloat } from "../contract";
import type { RevealParams } from "./reveal";

export const revealGlsl: GlslPass<RevealParams> = {
  type: "reveal",
  kind: "cell",
  usesCell: true,
  glsl(p) {
    const n = p.matrix;
    const f = p.front;
    const fb = f.length * p.band;
    const clock = p.loop ? `mod(uTime,${glslFloat(p.duration + p.hold)})` : "uTime";
    const pick = f.map((v, i) => `if(fi==${glslFloat(i)})tn=${glslFloat(v)};`).join("");
    const front = f.length
      ? `if(age<0.)tn=0.;else if(age<${glslFloat(fb)}){float fi=min(${glslFloat(f.length - 1)},floor(age/${glslFloat(p.band)}));${pick}}`
      : "if(age<0.)tn=0.;";
    return {
      decl: [BAYER_GLSL],
      body:
        `{float tn=floor(c.r+.5);if(tn>0.){vec2 q=vec2(cell.x,uCells.y-1.-cell.y);` +
        `float pr=min(1.,${clock}/${glslFloat(p.duration)});` +
        `float key=((q.y+(q.x+.5)/uCells.x)/uCells.y)*${glslFloat(1 - p.dither)}+(bayer${n}(q)+${glslFloat(0.5 / (n * n))})*${glslFloat(p.dither)};` +
        `float age=pr*${glslFloat(1 + fb)}-key;${front}c=vec4(tn,0.,0.,1.);}}`,
    };
  },
};
