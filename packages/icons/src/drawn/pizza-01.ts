import type { PixelIcon } from "../types";

// Pizza slice: a crust across the top, the slice narrowing to a point, one topping in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pizza-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    "..#......#",
    "..#..oo..#",
    "...#.oo.#",
    "...#....#",
    "....#..#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
