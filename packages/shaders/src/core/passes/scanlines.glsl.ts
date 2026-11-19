import { type GlslPass, glslFloat } from "../contract";
import type { ScanlinesParams } from "./scanlines";

export const scanlinesGlsl: GlslPass<ScanlinesParams> = {
  type: "scanlines",
  kind: "cell",
  usesCell: true,
  glsl(p) {
    const row = p.origin === "top" ? "uCells.y-1.-cell.y" : "cell.y";
    return {
      decl: [],
      body: `{if(mod(${row},${glslFloat(p.period)})<${glslFloat(p.width)})c.rgb*=${glslFloat(1 - p.strength)};}`,
    };
  },
};
