import { type GlslPass, glslFloat } from "../contract";
import type { HatchParams } from "./hatch";

const isAny = (list: readonly number[], v: string) =>
  list.length ? list.map((t) => `${v}==${glslFloat(t)}`).join("||") : "false";

export const hatchGlsl: GlslPass<HatchParams> = {
  type: "hatch",
  kind: "cell",
  usesCell: true,
  glsl(p) {
    const sign = p.direction === "down" ? "+" : "-";
    return {
      decl: [],
      body:
        `{vec2 q=vec2(cell.x,uCells.y-1.-cell.y);vec2 f=(q+.5)/uCells;float tn=floor(c.r+.5);` +
        `if(f.x>=${glslFloat(p.x0)}&&f.x<${glslFloat(p.x1)}&&f.y>=${glslFloat(p.y0)}&&f.y<${glslFloat(p.y1)}&&(${isAny(p.over, "tn")})){` +
        `float k=mod(q.x${sign}q.y+floor(uTime*${glslFloat(p.speed)}),${glslFloat(p.period)});` +
        `if(k<${glslFloat(p.width)})c=vec4(${glslFloat(p.tone)},0.,0.,1.);}}`,
    };
  },
};
