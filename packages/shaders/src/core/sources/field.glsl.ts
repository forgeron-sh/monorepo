import type { GlslChunk, GlslSource } from "../contract";
import { FIELD_MODES, type FieldParams } from "./field";

const NOISE_GLSL = `float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}`;

/** The value part of `main` above, unchanged, as the body of `source(cell)`. */
const FIELD_BODY = `
  vec2 uv=(cell+.5)*uPx/uRes;
  float aspect=uRes.x/uRes.y;
  vec2 p=vec2(uv.x*aspect,uv.y);
  float v=0.;
  if(uMode<.5){
    vec2 q=p*2.4;q.y-=uTime*.09;
    float n=fbm(q+fbm(q*1.4+vec2(0.,uTime*.06)));
    float heat=pow(smoothstep(.72,0.,uv.y),1.6);
    float m=length((uMouse-uv)*vec2(aspect,1.));
    v=n*heat*1.7-.08+.5*smoothstep(.25,0.,m)*n*smoothstep(.9,.3,uv.y);
  }else if(uMode<1.5){
    vec2 d=(p-vec2(aspect*.5,-.08))/.92;
    float r2=dot(d,d);
    if(r2<1.){
      float z=sqrt(1.-r2);vec3 n3=vec3(d,z);
      float l=clamp(dot(n3,normalize(vec3(-.5,.7,.6))),0.,1.);
      float lon=atan(n3.x,n3.z)+uTime*.08;
      float tex=fbm(vec2(lon*3.,n3.y*5.));
      v=l*(.15+1.05*tex)*smoothstep(1.,.9,r2)+.25*smoothstep(.9,1.,r2);
    }
  }else if(uMode<2.5){
    float band=floor(cell.y/5.);
    float edge=.18+.22*noise(vec2(band*.83,uTime*.12))+.08*sin(band*.4+uTime*.2);
    float x=uv.x-edge;
    v=x<0.?0.:1.-smoothstep(0.,.85-edge*.4,x);
  }else{
    v=fbm(p*2.6+vec2(uTime*.02,-uTime*.015))*.6-.12;
  }
  return vec4(v,0.,0.,1.);`;

/** The site's shader (the live canvases). */
export const fieldGlsl: GlslSource<FieldParams> = {
  type: "field",
  glsl(p): GlslChunk {
    return {
      decl: ["uniform float uMode;", NOISE_GLSL],
      body: FIELD_BODY,
      bind(set) {
        set.f1("uMode", FIELD_MODES[p.mode] ?? 0);
      },
    };
  },
};
