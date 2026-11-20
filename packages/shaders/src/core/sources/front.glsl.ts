import { type GlslSource, glslFloat } from "../contract";
import { type FrontParams, LOBES } from "./front";

export const frontGlsl: GlslSource<FrontParams> = {
  type: "front",
  glsl(p) {
    const f = glslFloat;
    const rect = p.shape === "rect";
    const forward = rect ? "close" : "open";
    const progress = p.driven
      ? "uProgress"
      : p.cycle > 0
        ? `clamp(mod(uTime,${f(p.cycle + p.hold)})/${f(p.cycle)},0.,1.)`
        : f(p.progress);
    const k = p.direction === forward ? "pr" : "(1.-pr)";
    const geometry = rect
      ? `float left=floor(k*${f(p.left)}*W+.5);float right=floor(W+(${f(p.right)}*W-W)*k+.5);float top=floor(k*${f(p.top)}*H+.5);float bottom=floor(H+(${f(p.bottom)}*H-H)*k+.5);` +
        `float g=min(min(p.x-left,right-p.x),min(p.y-top,bottom-p.y));float rr=${f(p.ring)};` +
        `float life=sm(clamp((1.-k)/.5,0.,1.))*sm(clamp(k/.2,0.,1.));`
      : `float e=k<.5?4.*k*k*k:1.-pow(-2.*k+2.,3.)/2.;float rr=max(1.,floor(${f(p.ring)}+${f(p.grow)}*e+.5));` +
        `float radius=e*(length(vec2(W,H))/2.+3.*rr+12.)/${f(1 - p.amp)};vec2 d=p-vec2(W,H)/2.;float th=atan(d.y,d.x);` +
        `float lobe=(sin(th*3.+${f(LOBES[0])}+uTime*.4)*.55+sin(th*5.+${f(LOBES[1])}-uTime*.7)*.3+sin(th*9.+${f(LOBES[2])}+uTime)*.2+sin(th*17.+${f(LOBES[3])})*.1)/1.15;` +
        `float g=radius*(1.+${f(p.amp)}*lobe)-length(d);float life=sm(clamp((1.-k)/.35,0.,1.));`;
    const out = p.outside === "page" ? "0." : "1.";
    const edge = rect ? "v=1.;g=999.;" : `v=${out};`;
    return {
      decl: ["float sm(float q){return q*q*(3.-2.*q);}"],
      body:
        `float W=uCells.x;float H=uCells.y;vec2 p=vec2(cell.x+.5,uCells.y-1.-cell.y+.5);` +
        `float pr=${progress};float k=${k};${geometry}float v;float a=life;` +
        `if(k<=0.){${edge}a=0.;}else if(k>=1.){v=g>=0.?1.:${out};a=0.;}` +
        `else{v=g<0.?${out}:g<rr?${f(5 / 16)}:g<2.*rr?${f(11 / 16)}:1.;}` +
        `return vec4(v,g,a,1.);`,
    };
  },
};
