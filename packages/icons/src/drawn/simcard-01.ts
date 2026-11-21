import type { PixelIcon } from "../types";

// A SIM card: a card with the upper right corner cut and the chip in the middle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "simcard-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..######",
    "..#.....#",
    "..#......#",
    "..#......#",
    "..#.oooo.#",
    "..#.o..o.#",
    "..#.oooo.#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
