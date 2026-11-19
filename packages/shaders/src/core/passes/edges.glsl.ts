import { type GlslPass, glslFloat } from "../contract";
import type { EdgesParams } from "./edges";

export const edgesGlsl: GlslPass<EdgesParams> = {
  type: "edges",
  kind: "neighbourhood",
  usesCell: true,
  glsl(p) {
    return {
      decl: [`float edgeAt(vec2 c,float x,float y){return prevAt(c+vec2(x,y)).r;}`],
      body: `{float tl=edgeAt(cell,-1.,1.),t=edgeAt(cell,0.,1.),tr=edgeAt(cell,1.,1.),l=edgeAt(cell,-1.,0.),r=edgeAt(cell,1.,0.),bl=edgeAt(cell,-1.,-1.),b=edgeAt(cell,0.,-1.),br=edgeAt(cell,1.,-1.);float gx=(tr+2.*r+br)-(tl+2.*l+bl);float gy=(tl+2.*t+tr)-(bl+2.*b+br);c=vec4(min(1.,sqrt(gx*gx+gy*gy)*${glslFloat(p.scale)}),0.,0.,1.);}`,
    };
  },
};
