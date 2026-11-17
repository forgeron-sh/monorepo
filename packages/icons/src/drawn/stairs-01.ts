import type { PixelIcon } from "../types";

// Stairs: three steps rising to the right, closed by the wall and floor.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "stairs-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........###",
    "........#.#",
    "........#.#",
    ".....####.#",
    ".....#....#",
    ".....#....#",
    "..####....#",
    "..#.......#",
    "..#.......#",
    "..#########",
  ],
};

export default icon;
