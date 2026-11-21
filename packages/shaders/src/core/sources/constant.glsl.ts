import { type GlslSource, glslFloat } from "../contract";
import type { ConstantParams } from "./constant";

export const constantGlsl: GlslSource<ConstantParams> = {
  type: "constant",
  glsl: (p) => ({ decl: [], body: `return vec4(${glslFloat(p.value)},0.,0.,1.);` }),
};
