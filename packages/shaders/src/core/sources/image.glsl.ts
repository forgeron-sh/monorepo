import type { GlslSource } from "../contract";

export const imageGlsl: GlslSource<Record<string, never>> = {
  type: "image",
  glsl: () => ({
    decl: ["uniform highp sampler2D uImage;"],
    body: "return texelFetch(uImage,ivec2(int(cell.x),int(uCells.y-1.-cell.y)),0);",
    bind(set) {
      set.texture("uImage", "image");
    },
  }),
};
