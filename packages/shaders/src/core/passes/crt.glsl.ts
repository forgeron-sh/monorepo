import { type GlslPass, glslFloat } from "../contract";
import type { CrtParams } from "./crt";

export const crtGlsl: GlslPass<CrtParams> = {
  type: "crt",
  kind: "present",
  cut: true,
  usesCell: true,
  glsl(p) {
    const f = glslFloat;
    return {
      decl: [],
      body: `{vec2 q=frag/uRes*2.-1.;float r2=dot(q,q);vec2 u=(q*(1.+${f(p.curvature)}*r2))*.5+.5;if(u.x<0.||u.x>=1.||u.y<0.||u.y>=1.){c=vec4(0.,0.,0.,1.);}else{vec2 s=floor(u*uRes/uPx);c=prevAt(s);vec3 m=vec3(0.);for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++)m+=prevAt(s+vec2(float(i),float(j))).rgb;c.rgb+=${f(p.bloom)}*m/9.;float col=mod(floor(frag.x),3.);vec3 a=vec3(col==0.?1.:${f(1 - p.mask)},col==1.?1.:${f(1 - p.mask)},col==2.?1.:${f(1 - p.mask)});c.rgb=min(c.rgb*a*(1.-${f(p.vignette)}*r2*.5),1.);c.a=1.;}}`,
    };
  },
};
