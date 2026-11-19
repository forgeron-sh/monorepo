import { type ColorRef, resolveRef, type RGB } from "../core/color";
import type { CpuContext, UniformSetter } from "../core/contract";
import { type CompileOptions, compileStages, GL_VERTEX } from "../core/glsl";
import type { Chain } from "../core/contract";
import type { ImagePixels } from "../core/sources/image";
import { linkProgram } from "./gl";

/**
 * A chain on the GPU (`chainOf(preset)` for JSON): its stages on one WebGL2 context, one program each, ping-pong `RGBA32F`
 * framebuffers at cell resolution between stages (`EXT_color_buffer_float`), the last stage at
 * output resolution into the canvas. Every current effect is one stage: one program, no
 * framebuffer.
 */

export interface GlFrameInputs {
  /** Output size in device pixels (the canvas's backing store). */
  width: number;
  height: number;
  /** Device pixels per cell. */
  px: number;
  time?: number;
  mouse?: readonly [number, number];
  /** Pixels of an `image` source, uploaded when they change (by identity). */
  image?: ImagePixels;
}

export interface GlPipeline {
  render(inputs: GlFrameInputs): void;
  dispose(): void;
}

export interface GlPipelineOptions extends CompileOptions {
  resolve?: (ref: ColorRef) => RGB;
}

/** Throws when a stage does not compile or the chain needs float framebuffers it cannot have. */
export function createGlPipeline(
  gl: WebGL2RenderingContext,
  chain: Chain,
  options: GlPipelineOptions = {},
): GlPipeline {
  const stages = compileStages(chain, options).map((stage) => {
    const program = linkProgram(
      gl,
      GL_VERTEX,
      stage.fragment,
      `shaders (${chain.name ?? "chain"})`,
    );
    const locations = new Map<string, WebGLUniformLocation | null>();
    const at = (name: string) => {
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
      return locations.get(name) ?? null;
    };
    return { ...stage, program, at };
  });
  if (stages.length > 1 && !gl.getExtension("EXT_color_buffer_float"))
    throw new Error("shaders: a chain of several stages needs EXT_color_buffer_float");
  const vao = gl.createVertexArray();
  const resolve = options.resolve ?? ((ref: ColorRef) => resolveRef(ref));
  const textures = new Map<string, WebGLTexture>();
  let uploaded: ImagePixels | undefined;
  const targets: { tex: WebGLTexture; fbo: WebGLFramebuffer }[] = [];
  let targetSize = "";

  const ensureTargets = (cols: number, rows: number) => {
    const key = `${cols}x${rows}`;
    if (key === targetSize) return;
    targetSize = key;
    for (const t of targets.splice(0)) {
      gl.deleteTexture(t.tex);
      gl.deleteFramebuffer(t.fbo);
    }
    for (let i = 0; i < Math.min(2, stages.length - 1); i++) {
      const tex = gl.createTexture();
      const fbo = gl.createFramebuffer();
      if (!tex || !fbo) throw new Error("shaders: no framebuffer");
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, cols, rows, 0, gl.RGBA, gl.FLOAT, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      targets.push({ tex, fbo });
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  const imageTexture = (img: ImagePixels | undefined) => {
    let tex = textures.get("image");
    if (!tex) {
      tex = gl.createTexture() ?? undefined;
      if (!tex) return null;
      textures.set("image", tex);
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    if (img && img !== uploaded) {
      uploaded = img;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        img.width,
        img.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        Uint8Array.from(img.data),
      );
    }
    return tex;
  };

  return {
    render(inputs) {
      const { width, height, px } = inputs;
      const cols = Math.max(1, Math.ceil(width / px));
      const rows = Math.max(1, Math.ceil(height / px));
      if (stages.length > 1) ensureTargets(cols, rows);
      const ctx: CpuContext = {
        time: inputs.time ?? 0,
        mouse: inputs.mouse ?? [0.5, 0.2],
        res: [width, height],
        px,
        resolve,
      };
      gl.bindVertexArray(vao);
      stages.forEach((stage, s) => {
        const last = s === stages.length - 1;
        gl.useProgram(stage.program);
        let unit = 0;
        const set: UniformSetter = {
          f1: (n, v) => gl.uniform1f(stage.at(n), v),
          f2: (n, x, y) => gl.uniform2f(stage.at(n), x, y),
          f4v: (n, v) => gl.uniform4fv(stage.at(n), v),
          i1: (n, v) => gl.uniform1i(stage.at(n), v),
          texture: (n, key) => {
            const tex = key === "image" ? imageTexture(inputs.image) : null;
            if (!tex) return;
            gl.activeTexture(gl.TEXTURE0 + unit);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform1i(stage.at(n), unit++);
          },
        };
        set.f2("uRes", width, height);
        set.f1("uPx", px);
        set.f2("uCells", cols, rows);
        set.f1("uTime", ctx.time);
        set.f2("uMouse", ctx.mouse[0], ctx.mouse[1]);
        if (s > 0) {
          const prev = targets[(s - 1) % 2];
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, prev?.tex ?? null);
          set.i1("uPrev", unit++);
        }
        for (const chunk of stage.chunks) chunk.bind?.(set, ctx);
        const target = last ? null : (targets[s % 2] ?? null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target?.fbo ?? null);
        gl.viewport(0, 0, last ? width : cols, last ? height : rows);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    dispose() {
      for (const s of stages) gl.deleteProgram(s.program);
      for (const t of targets) {
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fbo);
      }
      for (const t of textures.values()) gl.deleteTexture(t);
      gl.deleteVertexArray(vao);
    },
  };
}
