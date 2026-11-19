/**
 * WebGL2 helpers shared by the pipeline and Blueprint's presenter: compile, link, and the
 * context attributes of a pixel canvas (no antialiasing, straight alpha).
 */

export class ShaderCompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShaderCompileError";
  }
}

/** The attributes of a pixel canvas: no antialiasing, colours not premultiplied. */
export const PIXEL_CONTEXT: WebGLContextAttributes = {
  antialias: false,
  premultipliedAlpha: false,
};

/** Compiles one shader; throws with the driver's log, prefixed by `label`. */
export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
  label = "shaders",
): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new ShaderCompileError(`${label}: no shader (context lost?)`);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new ShaderCompileError(`${label}: ${gl.getShaderInfoLog(shader) ?? "shader"}`);
  return shader;
}

/** Compiles and links a program from a vertex and a fragment source; throws on failure. */
export function linkProgram(
  gl: WebGL2RenderingContext,
  vertex: string,
  fragment: string,
  label = "shaders",
): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new ShaderCompileError(`${label}: no program (context lost?)`);
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertex, label));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragment, label));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new ShaderCompileError(`${label}: ${gl.getProgramInfoLog(program) ?? "link"}`);
  return program;
}
