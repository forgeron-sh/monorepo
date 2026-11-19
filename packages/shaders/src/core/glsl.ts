import type { Chain, GlslChunk } from "./contract";

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

/** A full-screen triangle without buffers (the same triangle as the site's field). */
export const GL_VERTEX = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const HEADER = `#version 300 es
precision highp float;
uniform vec2 uRes;uniform float uTime;uniform float uPx;uniform vec2 uMouse;uniform vec2 uCells;`;

export interface CompileOptions {
  /** Cuts a stage after every pass (tests: the framebuffer path gives the same pixels). */
  split?: boolean;
}

/** Throws when the source has no GLSL (a CPU-only source). */
export function compileStages(chain: Chain, options: CompileOptions = {}): GlStage[] {
  const sourceDef = chain.source.def;
  if (!sourceDef.glsl) throw new Error(`The source "${sourceDef.type}" runs on the CPU only.`);
  const source = sourceDef.glsl(chain.source.params as never, "s_");
  const groups: { type: string; chunk: GlslChunk; present: boolean }[][] = [[]];
  chain.passes.forEach(({ def, params }, i) => {
    if (def.kind === "layout") return;
    const entry = {
      type: def.type,
      chunk: def.glsl(params as never, `p${i}_`),
      present: def.kind === "present",
    };
    const current = groups[groups.length - 1] ?? [];
    if (options.split && current.length > 0 && !current.some((g) => g.present))
      groups.push([entry]);
    else current.push(entry);
  });
  // A present pass belongs to the last stage: fold every group from the first present one.
  const firstPresent = groups.findIndex((g) => g.some((e) => e.present));
  if (firstPresent >= 0 && firstPresent < groups.length - 1)
    groups.splice(firstPresent, groups.length - firstPresent, groups.slice(firstPresent).flat());

  return groups.map((group, s) => {
    const last = s === groups.length - 1;
    const first = s === 0;
    const chunks = first ? [source, ...group.map((g) => g.chunk)] : group.map((g) => g.chunk);
    const decls = [...new Set(chunks.flatMap((c) => c.decl))];
    const lines = [HEADER];
    if (!first) lines.push("uniform highp sampler2D uPrev;");
    lines.push("out vec4 fragColor;", ...decls);
    if (first) lines.push(`vec4 source(vec2 cell){${source.body}\n}`);
    lines.push("void main(){");
    lines.push(
      last
        ? "  vec2 frag=gl_FragCoord.xy;vec2 cell=floor(frag/uPx);"
        : "  vec2 cell=floor(gl_FragCoord.xy);",
    );
    lines.push(first ? "  vec4 c=source(cell);" : "  vec4 c=texelFetch(uPrev,ivec2(cell),0);");
    for (const g of group) lines.push(`  ${g.chunk.body}`);
    lines.push("  fragColor=c;", "}");
    return { fragment: lines.join("\n"), chunks, cellResolution: !last };
  });
}
