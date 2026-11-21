import type { GlChain, GlslChunk } from "./contract";

/**
 * GLSL of a chain: cut into stages (docs/shaders/design.md §2, "Pipeline"). Cell
 * passes fuse into the stage before them; the last stage runs at output resolution and holds the
 * `present` passes. A stage that is not the last renders one texel per cell into a float
 * framebuffer that the next one reads with `texelFetch`.
 */

export interface GlStage {
  /** The fragment shader, GLSL ES 3.00. */
  fragment: string;
  /** The chunks whose uniforms it binds, in order. */
  chunks: readonly GlslChunk[];
  /** One fragment per cell (into a framebuffer) rather than per output pixel. */
  cellResolution: boolean;
}

const HEADER = `#version 300 es
precision highp float;
uniform vec2 uRes;uniform float uTime;uniform float uPx;uniform vec2 uMouse;uniform vec2 uCells;uniform float uProgress;`;

export interface CompileOptions {
  /** Cuts a stage after every pass (tests: the framebuffer path gives the same pixels). */
  split?: boolean;
}

/** In a stage after the first: the previous stage at a cell, clamped to the edges. */
const PREV = `uniform highp sampler2D uPrev;
vec4 prevAt(vec2 p){return texelFetch(uPrev,clamp(ivec2(p),ivec2(0),ivec2(uCells)-1),0);}`;

interface Entry {
  chunk: GlslChunk;
  present: boolean;
}

/**
 * Throws when the source or a pass has no GLSL (CPU only). A `neighbourhood` pass starts a
 * stage (it reads the previous one at other cells), and so does each chunk after the first of a
 * pass that returns several (the two halves of a separable blur).
 */
export function compileStages(chain: GlChain, options: CompileOptions = {}): GlStage[] {
  const sourceDef = chain.source.def;
  if (!sourceDef.glsl) throw new Error(`The source "${sourceDef.type}" runs on the CPU only.`);
  const source = sourceDef.glsl(chain.source.params as never, "s_");
  const groups: Entry[][] = [[]];
  chain.passes.forEach(({ def, params }, i) => {
    if (def.kind === "layout") return;
    if (!def.glsl) throw new Error(`The pass "${def.type}" runs on the CPU only.`);
    const out = def.glsl(params as never, `p${i}_`);
    const present = def.kind === "present";
    (Array.isArray(out) ? (out as readonly GlslChunk[]) : [out as GlslChunk]).forEach(
      (chunk, k) => {
        const current = groups[groups.length - 1] ?? [];
        // Nothing cuts after a present pass: it belongs to the last stage, at output resolution.
        const cut =
          !current.some((e) => e.present) &&
          (k > 0 ||
            def.kind === "neighbourhood" ||
            def.cut ||
            (options.split && current.length > 0));
        if (cut) groups.push([{ chunk, present }]);
        else current.push({ chunk, present });
      },
    );
  });

  return groups.map((group, s) => {
    const last = s === groups.length - 1;
    const first = s === 0;
    const chunks = first ? [source, ...group.map((g) => g.chunk)] : group.map((g) => g.chunk);
    const decls = [...new Set(chunks.flatMap((c) => c.decl))];
    const lines = [HEADER];
    if (!first) lines.push(PREV);
    lines.push("out vec4 fragColor;", ...decls);
    if (first) lines.push(`vec4 source(vec2 cell){${source.body}\n}`);
    lines.push("void main(){");
    lines.push(
      last
        ? "  vec2 frag=gl_FragCoord.xy;vec2 cell=floor(frag/uPx);"
        : "  vec2 cell=floor(gl_FragCoord.xy);",
    );
    lines.push(first ? "  vec4 c=source(cell);" : "  vec4 c=prevAt(cell);");
    for (const g of group) lines.push(`  ${g.chunk.body}`);
    lines.push("  fragColor=c;", "}");
    return { fragment: lines.join("\n"), chunks, cellResolution: !last };
  });
}
