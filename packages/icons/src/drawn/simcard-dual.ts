import type { PixelIcon } from "../types";

// Two SIM cards, one behind the other, the chip of `simcard-01` on the front one.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "simcard-dual",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#####",
    "....#....#",
    ".#####....#",
    ".#....#...#",
    ".#.....#..#",
    ".#.....#..#",
    ".#.ooo.#..#",
    ".#.o.o.####",
    ".#.ooo.#",
    ".#.....#",
    ".#######",
  ],
};

export default icon;
