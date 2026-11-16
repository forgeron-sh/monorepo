import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`cli`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "command-line",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "############",
    "#oo#########",
    "#..........#",
    "#.o........#",
    "#..o.#.#.#.#",
    "#.o........#",
    "#..........#",
    "#.#.##.#...#",
    "#..........#",
    "#.oo.......#",
    "#.oo.......#",
    "############",
  ],
};

export default icon;
