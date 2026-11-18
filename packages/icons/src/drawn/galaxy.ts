import type { PixelIcon } from "../types";

// Spiral galaxy: two arms curling round a bright core in the secondary tone, half-turn symmetric.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "galaxy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....###",
    "...#...#.#",
    "..#....#.#",
    "..#..oo..#",
    "..#..oo..#",
    "..#.#....#",
    "..#.#...#",
    ".....###",
  ],
};

export default icon;
