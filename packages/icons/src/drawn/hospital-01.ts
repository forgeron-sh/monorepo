import type { PixelIcon } from "../types";

// Hospital: a building with a two-pixel cross in the secondary tone and a door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hospital-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#..oo..#",
    "..#.oooo.#",
    "..#.oooo.#",
    "..#..oo..#",
    "..#......#",
    "..#..##..#",
    "..#..##..#",
    ".##########",
  ],
};

export default icon;
