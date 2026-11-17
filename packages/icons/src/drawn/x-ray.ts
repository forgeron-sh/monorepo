import type { PixelIcon } from "../types";

// X-ray: a frame with a bone in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "x-ray",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#.oo..oo.#",
    ".#.o.oo.o.#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#.o.oo.o.#",
    ".#.oo..oo.#",
    "..########",
  ],
};

export default icon;
