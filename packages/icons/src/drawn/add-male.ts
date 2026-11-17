import type { PixelIcon } from "../types";

// Add a man: a small male sign, a plus badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "add-male",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......###",
    "........##",
    ".......#.#",
    "..###.#",
    ".#...#",
    ".#...#...o",
    ".#...#...o",
    "..###..ooooo",
    ".........o",
    ".........o",
  ],
};

export default icon;
