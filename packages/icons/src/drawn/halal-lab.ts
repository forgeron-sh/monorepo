import type { PixelIcon } from "../types";

// Halal lab: the flask of `flask-conical` with a crescent in the secondary tone instead of the liquid.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "halal-lab",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "....#..#",
    "....#..#",
    "...#....#",
    "..#..ooo.#",
    ".#..oo....#",
    ".#..o.....#",
    ".#..oo....#",
    ".#...ooo..#",
    ".##########",
  ],
};

export default icon;
