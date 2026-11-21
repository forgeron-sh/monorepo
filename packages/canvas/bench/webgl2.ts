// A minimal WebGL2 renderer: one instanced draw of rectangles from the instance buffer (x, y, w,
// h in world units, kind, flags), the camera in a uniform. Both the TypeScript and the Rust
// engines feed it the same layout, so the draw costs the same whoever built the buffer.

const VERTEX = `#version 300 es
layout(location = 0) in vec2 corner;
layout(location = 1) in vec4 rect;
layout(location = 2) in vec2 meta;
uniform vec3 view;   // x, y, zoom: screen = world * zoom + (x, y)
uniform vec2 size;   // the surface in pixels
flat out int kind;
flat out int flags;
out vec2 local;
out vec2 px;
void main() {
  vec2 screen = (rect.xy + corner * rect.zw) * view.z + view.xy;
  gl_Position = vec4(screen / size * 2.0 - 1.0, 0.0, 1.0) * vec4(1.0, -1.0, 1.0, 1.0);
  kind = int(meta.x);
  flags = int(meta.y);
  local = corner;
  px = rect.zw * view.z;
}`;

const FRAGMENT = `#version 300 es
precision mediump float;
flat in int kind;
flat in int flags;
in vec2 local;
in vec2 px;
uniform vec4 palette[4];
out vec4 colour;
void main() {
  vec2 d = min(local, 1.0 - local) * px;
  bool edge = min(d.x, d.y) < 1.0;
  vec4 c = palette[kind & 3];
  colour = edge ? vec4(c.rgb * 0.6, 1.0) : ((flags & 8) != 0 ? mix(c, vec4(1.0, 0.45, 0.1, 1.0), 0.5) : c);
}`;

export interface Renderer {
  /** Uploads `count` instances (STRIDE floats each) and draws them; returns [uploadMs, drawMs].
   *  With `sync`, waits for the GPU (a one-pixel readPixels) so the draw time is the GPU's too. */
  draw(
    data: Float32Array,
    count: number,
    view: { x: number; y: number; zoom: number },
    sync: boolean,
  ): [number, number];
  readonly info: string;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

export function createRenderer(canvas: HTMLCanvasElement, stride: number): Renderer {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: false,
  })!;
  if (!gl) throw new Error("no WebGL2");
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program) ?? "link");
  gl.useProgram(program);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const instances = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instances);
  let capacity = 0;
  const bytes = stride * 4;
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, bytes, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, bytes, 16);
  gl.vertexAttribDivisor(2, 1);

  const uView = gl.getUniformLocation(program, "view");
  const uSize = gl.getUniformLocation(program, "size");
  gl.uniform4fv(
    gl.getUniformLocation(program, "palette"),
    // node, sticky, table, frame
    new Float32Array([
      0.93, 0.94, 0.96, 1, 1, 0.86, 0.45, 1, 0.84, 0.92, 1, 1, 0.97, 0.97, 0.97, 1,
    ]),
  );
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.11, 0.11, 0.12, 1);
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  const info = dbg
    ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
    : String(gl.getParameter(gl.RENDERER));

  const pixel = new Uint8Array(4);
  return {
    info,
    draw(data, count, view, sync) {
      const t0 = performance.now();
      const floats = count * stride;
      if (floats > capacity) {
        capacity = Math.max(floats, capacity * 2);
        gl.bufferData(gl.ARRAY_BUFFER, capacity * 4, gl.DYNAMIC_DRAW);
      }
      // A view of the engine's buffer (WebAssembly memory or a Float32Array): no copy in JS.
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, floats);
      const t1 = performance.now();
      gl.uniform3f(uView, view.x, view.y, view.zoom);
      gl.uniform2f(uSize, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
      if (sync) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      return [t1 - t0, performance.now() - t1];
    },
  };
}
