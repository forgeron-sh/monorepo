import { type ColorRef, resolveRef, type RGB } from "../core/color";
import type { CpuContext, FloatTable, GlChain, UniformSetter } from "../core/contract";
import { type CompileOptions, compileStages } from "../core/glsl";
import { GL_VERTEX } from "../core/vertex";
import type { ImagePixels } from "../core/sources/image";
import { linkProgram } from "./gl";

/**
 * A chain on the GPU (`chainOf(preset)` for JSON): its stages on one WebGL2 context, one program
 * each, ping-pong `RGBA32F` framebuffers at cell resolution between stages
 * (`EXT_color_buffer_float`), the last stage at output resolution into the canvas.
 *
 * Two entries: `createGlPipeline` (`pipeline-gl-ext.ts`) runs any chain; `glPipeline` takes the
 * framebuffers and the textures as extensions, so a mount whose chain is one stage without textures (the fields)
 * does not bundle them (docs/shaders/design.md, S2 notes).
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

/** The framebuffers between stages: stage `s` draws into `target(s)` and reads `source(s)`. */
export interface GlTargets {
  size(cols: number, rows: number): void;
  target(stage: number): WebGLFramebuffer | null;
  source(stage: number): WebGLTexture | null;
  dispose(): void;
}

/** The textures a chunk binds by key: the image source's pixels, float tables. */
export interface GlTextures {
  get(key: string, image: ImagePixels | undefined, table?: () => FloatTable): WebGLTexture | null;
  dispose(): void;
}

export interface GlExtensions {
  targets?: (gl: WebGL2RenderingContext, stages: number) => GlTargets;
  textures?: (gl: WebGL2RenderingContext) => GlTextures;
}

/**
 * A chain on the GPU with the extensions given. Throws when a stage does not compile, or the
 * chain needs framebuffers or textures it was not given.
 */
export function glPipeline(
  gl: WebGL2RenderingContext,
  chain: GlChain,
  options: GlPipelineOptions = {},
  ext: GlExtensions = {},
): GlPipeline {
  const label = `shaders (${chain.name ?? "chain"})`;
  const stages = compileStages(chain, options).map((stage) => {
    const program = linkProgram(gl, GL_VERTEX, stage.fragment, label);
    const locations = new Map<string, WebGLUniformLocation | null>();
    const at = (name: string) => {
      if (!locations.has(name)) locations.set(name, gl.getUniformLocation(program, name));
      return locations.get(name) ?? null;
    };
    return { ...stage, program, at };
  });
  let targets: GlTargets | undefined;
  if (stages.length > 1) {
    if (!ext.targets) throw new Error(`${label}: several stages need framebuffers`);
    targets = ext.targets(gl, stages.length);
  }
  const textures = ext.textures?.(gl);
  const vao = gl.createVertexArray();
  const resolve = options.resolve ?? ((ref: ColorRef) => resolveRef(ref));

  return {
    render(inputs) {
      const { width, height, px } = inputs;
      const cols = Math.max(1, Math.ceil(width / px));
      const rows = Math.max(1, Math.ceil(height / px));
      targets?.size(cols, rows);
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
        // The unit is made active first: making a texture binds it to the active unit.
        const bind = (name: string, tex: () => WebGLTexture | null | undefined) => {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, tex() ?? null);
          gl.uniform1i(stage.at(name), unit++);
        };
        const set: UniformSetter = {
          f1: (n, v) => gl.uniform1f(stage.at(n), v),
          f2: (n, x, y) => gl.uniform2f(stage.at(n), x, y),
          f4v: (n, v) => gl.uniform4fv(stage.at(n), v),
          i1: (n, v) => gl.uniform1i(stage.at(n), v),
          texture: (n, key, table) => {
            if (!textures) throw new Error(`${label}: a texture needs the textures extension`);
            bind(n, () => textures.get(key, inputs.image, table));
          },
        };
        set.f2("uRes", width, height);
        set.f1("uPx", px);
        set.f2("uCells", cols, rows);
        set.f1("uTime", ctx.time);
        set.f2("uMouse", ctx.mouse[0], ctx.mouse[1]);
        if (s > 0) bind("uPrev", () => targets?.source(s));
        for (const chunk of stage.chunks) chunk.bind?.(set, ctx);
        gl.bindFramebuffer(gl.FRAMEBUFFER, last ? null : (targets?.target(s) ?? null));
        gl.viewport(0, 0, last ? width : cols, last ? height : rows);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    dispose() {
      for (const s of stages) gl.deleteProgram(s.program);
      targets?.dispose();
      textures?.dispose();
      gl.deleteVertexArray(vao);
    },
  };
}
