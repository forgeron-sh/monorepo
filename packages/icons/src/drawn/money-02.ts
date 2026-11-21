import type { PixelIcon } from "../types";

// Two banknotes stacked: `money-01` in front, the edge of a second note behind at the top right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "money-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#",
    ".########.#",
    ".#......#.#",
    ".#..oo..#.#",
    ".#.o..o.#.#",
    ".#.o..o.#.#",
    ".#..oo..###",
    ".#......#",
    ".########",
  ],
};

export default icon;
