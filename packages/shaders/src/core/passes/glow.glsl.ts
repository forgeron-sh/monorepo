import { BAYER_GLSL } from "../bayer";
import { type GlslPass, glslFloat } from "../contract";
import { binomial, type GlowParams } from "./glow";

const isAny = (list: readonly number[], v: string) =>
  list.length ? list.map((t) => `${v}==${glslFloat(t)}`).join("||") : "false";

export const glowGlsl: GlslPass<GlowParams> = {
  type: "glow",
  kind: "neighbourhood",
  usesCell: true,
  glsl(p) {
    const w = binomial(p.radius);
    const r = p.radius;
    const sum = (axis: "x" | "y", read: string) =>
      w
        .map((k, i) => {
          const d = glslFloat(i - r);
          const at = axis === "x" ? `vec2(${d},0.)` : `vec2(0.,${d})`;
          return `${glslFloat(k)}*${read.replace("$", `prevAt(cell+${at})`)}`;
        })
        .join("+");
    const n = p.matrix;
    const total = glslFloat(4 ** (2 * r));
    return [
      {
        decl: [],
        body: `{float s=${sum("x", `(${isAny(p.tones, "floor($.r+.5)")}?1.:0.)`)};c=vec4(c.r,s,0.,1.);}`,
      },
      {
        decl: [BAYER_GLSL],
        body: `{float g=(${sum("y", "$.g")})/${total};float tn=floor(c.r+.5);float t=bayer${n}(vec2(cell.x,uCells.y-1.-cell.y))+${glslFloat(0.5 / (n * n))};if((${isAny(p.over, "tn")})&&g*${glslFloat(p.strength)}>t)tn=${glslFloat(p.tone)};c=vec4(tn,0.,0.,1.);}`,
      },
    ];
  },
};
