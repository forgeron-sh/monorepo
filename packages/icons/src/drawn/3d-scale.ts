import type { PixelIcon } from "../types";

// 3D scale: a cube in oblique view and an arrow out of its top corner in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "3d-scale",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......oooo",
    ".........oo",
    "........o.o",
    "",
    "...######",
    "..#....##",
    ".######.#",
    ".#....#.#",
    ".#....#.#",
    ".#....##",
    ".######",
  ],
};

export default icon;
