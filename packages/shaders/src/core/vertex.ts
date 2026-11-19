// Apart from glsl.ts, so that a mount with its GLSL compiled ahead of time (the field) does not
// bundle the stage compiler.

/** A full-screen triangle without buffers (the same triangle as the site's field). */
export const GL_VERTEX = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
