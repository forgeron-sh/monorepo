import type { PixelIcon } from "../types";

// Two banknotes stacked like `money-02`, a bitcoin sign on the front one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bitcoin-money-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...########",
    "...#......#",
    ".########.#",
    ".#......#.#",
    ".#.ooo..#.#",
    ".#.o..o.#.#",
    ".#.ooo..#.#",
    ".#.o..o.#.#",
    ".#.ooo..###",
    ".#......#",
    ".########",
  ],
};

export default icon;
