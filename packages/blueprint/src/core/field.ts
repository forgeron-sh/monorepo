/**
 * Generator fields: full-surface backgrounds computed per pixel cell (ember, globe, dissolve,
 * field), quantised to two colours (three with the accent) by an 8×8 ordered dither.
 *
 * They run as a WebGL fragment shader (`mountField` in `@forgeron/blueprint/dom`), not on the CPU
 * frame: a full-screen hero is 50 000 to 80 000 cells of nested fractal noise per frame, about
 * 17 ms on the CPU of an M4 for one hero alone, and the hash noise below depends on GPU float
 * precision, so a CPU port could not reproduce the pictures the site shows. The shader source is
 * plain data and lives here, in the neutral core; only the WebGL glue is in `dom/`.
 * See docs/migration.md, "Generators".
 */

/** The fields a generator block can draw. */
export type FieldMode = "ember" | "globe" | "dissolve" | "field";

export const FIELD_MODES: Readonly<Record<FieldMode, number>> = {
  ember: 0,
  globe: 1,
  dissolve: 2,
  field: 3,
};

/** A full-screen triangle. */
export const FIELD_VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

/**
 * The fragment shader. Per cell of `uPx` device pixels: a value `v` from the mode, then
 * `v > bayer8(cell)` → ink (accent above a second threshold when `uAccentOn`), else bg; cells of
 * 4 pixels or more leave a one-pixel gap on their right and top edges. `bayer8` here is the same
 * matrix as `bayer(x, y, 8)` of the core, without its half-step offset (a test checks it).
 */
export const FIELD_FRAGMENT = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform float uPx;uniform vec2 uMouse;uniform float uMode;uniform float uAccentOn;
uniform vec3 uBg;uniform vec3 uInk;uniform vec3 uAccent;
float bayer2(vec2 a){a=floor(a);return fract(dot(a,vec2(.5,a.y*.75)));}
float bayer4(vec2 a){return bayer2(.5*a)*.25+bayer2(a);}
float bayer8(vec2 a){return bayer4(.5*a)*.25+bayer2(a);}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 cell=floor(gl_FragCoord.xy/uPx);
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
  float t=bayer8(cell);
  vec3 col=uBg;
  if(v>t){col=uInk;if(uAccentOn>.5&&v>.86+t*.12)col=uAccent;}
  vec2 f=fract(gl_FragCoord.xy/uPx);
  if(uPx>=4.&&(f.x>.84||f.y>.84))col=uBg;
  gl_FragColor=vec4(col,1.);
}`;
