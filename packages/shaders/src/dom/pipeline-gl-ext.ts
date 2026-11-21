import type { FloatTable } from "../core/contract";
import type { GlChain } from "../core/contract";
import type { ImagePixels } from "../core/sources/image";
import {
  type GlPipeline,
  glPipeline,
  type GlPipelineOptions,
  type GlTargets,
  type GlTextures,
} from "./pipeline-gl";

/**
 * The extensions of the GPU pipeline (`createGlPipeline` takes both): ping-pong `RGBA32F`
 * framebuffers at cell resolution between stages, and the textures chunks bind by key.
 */

const nearest = (gl: WebGL2RenderingContext) => {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
};

/** Two float framebuffers (one for a chain of two stages); stage `s` writes `s % 2`. */
export function floatTargets(gl: WebGL2RenderingContext, stages: number): GlTargets {
  if (!gl.getExtension("EXT_color_buffer_float"))
    throw new Error("shaders: a chain of several stages needs EXT_color_buffer_float");
  const targets: { tex: WebGLTexture; fbo: WebGLFramebuffer }[] = [];
  let current = "";
  const free = () => {
    for (const t of targets.splice(0)) {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    }
  };
  return {
    size(cols, rows) {
      const key = `${cols}x${rows}`;
      if (key === current) return;
      current = key;
      free();
      for (let i = 0; i < Math.min(2, stages - 1); i++) {
        const tex = gl.createTexture();
        const fbo = gl.createFramebuffer();
        if (!tex || !fbo) throw new Error("shaders: no framebuffer");
        gl.bindTexture(gl.TEXTURE_2D, tex);
        nearest(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, cols, rows, 0, gl.RGBA, gl.FLOAT, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        targets.push({ tex, fbo });
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    target: (s) => targets[s % 2]?.fbo ?? null,
    source: (s) => targets[(s - 1) % 2]?.tex ?? null,
    dispose: free,
  };
}

/**
 * Textures by key: `"image"` holds the image source's pixels (`RGBA8`, uploaded again when they
 * change by identity); any other key a float table (`R32F`), made once.
 */
export function textureStore(gl: WebGL2RenderingContext): GlTextures {
  const textures = new Map<string, WebGLTexture>();
  let uploaded: ImagePixels | undefined;
  return {
    get(key, image, table?: () => FloatTable) {
      let tex = textures.get(key);
      const fresh = !tex;
      if (!tex) {
        tex = gl.createTexture() ?? undefined;
        if (!tex) return null;
        textures.set(key, tex);
      }
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (key === "image") {
        if (image && image !== uploaded) {
          uploaded = image;
          nearest(gl);
          gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA8,
            image.width,
            image.height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            Uint8Array.from(image.data),
          );
        }
      } else if (fresh && table) {
        const t = table();
        nearest(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, t.width, t.height, 0, gl.RED, gl.FLOAT, t.data);
      }
      return tex;
    },
    dispose() {
      for (const t of textures.values()) gl.deleteTexture(t);
    },
  };
}

/** Any chain: every stage and texture. Throws as `glPipeline`. */
export const createGlPipeline = (
  gl: WebGL2RenderingContext,
  chain: GlChain,
  options: GlPipelineOptions = {},
): GlPipeline => glPipeline(gl, chain, options, { targets: floatTargets, textures: textureStore });
