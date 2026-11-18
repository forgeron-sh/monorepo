import type { PixelIcon } from "../types";

// Upscale: a small picture with an arrow to the far corner in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "image-upscale",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......oooo",
    ".........oo",
    "........o.o",
    "..........o",
    ".######",
    ".#....#",
    ".#....#",
    ".#.#..#",
    ".####.#",
    ".######",
  ],
};

export default icon;
