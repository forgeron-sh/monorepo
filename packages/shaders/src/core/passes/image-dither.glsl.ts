import { BAYER_GLSL } from "../bayer";
import { type GlslPass, glslFloat } from "../contract";
import type { ImageDitherParams } from "./image-dither";

export const imageDitherGlsl: GlslPass<ImageDitherParams> = {
  type: "image-dither",
  kind: "cell",
  usesCell: true,
  glsl(p) {
    const L = glslFloat(p.greys - 1);
    return {
      decl: [BAYER_GLSL],
      body: `{vec3 b=floor(c.rgb*255.+.5);float lum=min(1.,((0.2126*b.r+0.7152*b.g+0.0722*b.b)/255.)*${glslFloat(p.gain)});float t=bayer4(vec2(cell.x,uCells.y-1.-cell.y))+0.03125;float k;if(b.r>110.&&b.r-b.b>70.&&b.r-b.g>30.){k=min(1.,(b.r/255.)*1.15)>t?${glslFloat(p.greys)}:0.;}else{float v=lum*${L};float lo=floor(v);k=v-lo>t?min(${L},lo+1.):lo;}c=vec4(k,0.,0.,1.);}`,
    };
  },
};
