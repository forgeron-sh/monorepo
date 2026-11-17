import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`web`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "browser",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "############",
    "#o#o#o######",
    "############",
    "#..........#",
    "#.#.#..###.#",
    "#..#.#.....#",
    "#.#.#..##..#",
    "#..#.#.....#",
    "#.......o..#",
    "#.......oo.#",
    "########ooo#",
    "........oo",
  ],
};

export default icon;
