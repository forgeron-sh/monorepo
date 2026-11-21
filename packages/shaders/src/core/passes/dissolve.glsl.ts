import { BAYER_GLSL } from "../bayer.glsl";
import { type GlslPass, glslFloat } from "../contract";
import type { DissolveParams } from "./dissolve";

const isAny = (list: readonly number[], v: string) =>
  list.length ? list.map((t) => `${v}==${glslFloat(t)}`).join("||") : "true";

export const dissolveGlsl: GlslPass<DissolveParams> = {
  type: "dissolve",
  kind: "cell",
  usesCell: true,
  glsl(p) {
    const n = p.matrix;
    const prog =
      p.cycle > 0
        ? `float ph=fract(uTime/${glslFloat(p.cycle)});float tr=ph<.5?ph*2.:2.-ph*2.;float e=tr*tr*(3.-2.*tr);`
        : `float e=${glslFloat(p.progress)};`;
    return {
      decl: [BAYER_GLSL],
      body:
        `{${prog}float tn=floor(c.r+.5);float t=bayer${n}(vec2(cell.x,uCells.y-1.-cell.y))+${glslFloat(0.5 / (n * n))};` +
        `if((${isAny(p.over, "tn")})&&t<e)c=vec4(${glslFloat(p.tone)},0.,0.,1.);}`,
    };
  },
};
