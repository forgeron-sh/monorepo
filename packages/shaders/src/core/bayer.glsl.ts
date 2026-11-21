// The GLSL side of bayer.ts, apart so that a CPU mount importing `bayer` does not bundle it.

/**
 * The same matrices in GLSL, without the half-step offset: `bayerN(cell)` is `matrix(N)` at
 * `cell` over `N²`, exactly (the site's field shader carried these three lines).
 */
export const BAYER_GLSL = `float bayer2(vec2 a){a=floor(a);return fract(dot(a,vec2(.5,a.y*.75)));}
float bayer4(vec2 a){return bayer2(.5*a)*.25+bayer2(a);}
float bayer8(vec2 a){return bayer4(.5*a)*.25+bayer2(a);}`;
