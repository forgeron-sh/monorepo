import type { PixelIcon } from "../types";

// Running person: a head in the secondary tone, the body leaning forward, legs in a long stride.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "workout-run",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......oo",
    ".......oo",
    "",
    "....####",
    "...#.##.#",
    "..#..##..#",
    ".....##",
    "....#..#",
    "...#....#",
    ".##......#",
    ".........#",
  ],
};

export default icon;
