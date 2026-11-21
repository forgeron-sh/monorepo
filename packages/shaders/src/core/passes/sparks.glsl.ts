import { type GlslPass, glslFloat } from "../contract";
import type { SparksParams } from "./sparks";

/** The CPU's `hash24`, in unsigned integers: the same bits. */
const HASH = `float hash24(float a,float b,float c){uint h=uint(int(a))*374761393u+uint(int(b))*668265263u+uint(int(c))*1274126177u;h=(h^(h>>13u))*1274126177u;return float((h^(h>>16u))>>8u)/16777216.;}`;

export const sparksGlsl: GlslPass<SparksParams> = {
  type: "sparks",
  kind: "cell",
  usesCell: true,
  glsl(p) {
    const f = glslFloat;
    const [outer = 2, middle = 3, inner = 4] = p.tones;
    return {
      decl: [HASH],
      body:
        `{float life=c.b;if(life>0.){vec2 q=vec2(cell.x,uCells.y-1.-cell.y);float g=c.g;float tick=floor(uTime/${f(p.tick)});` +
        `if(g>=0.){float u=q.x+q.y;float wave=(sin(u*.2+uTime*1.2)*.75+sin(u*.07-uTime*.6)*1.25)*${f(p.wobble)};` +
        `float d=floor(${f(p.offset)}-wave-g+.5);` +
        `if(d>=-2.&&d<=4.&&hash24(q.x,q.y,tick)<(${f(p.density)}-d*${f(p.falloff)})*life)c.r=d<0.?${f(outer)}:d<2.?${f(middle)}:${f(inner)};}` +
        `else if(g>-${f(p.reach)}&&hash24(q.x,q.y+4096.,tick)<${f(p.fly)}*life){c.r=hash24(q.x,q.y+8192.,tick)<.5?${f(middle)}:${f(inner)};}}}`,
    };
  },
};
