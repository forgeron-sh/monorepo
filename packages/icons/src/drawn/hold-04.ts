import type { PixelIcon } from "../types";

// Hand holding a coin: the offering hand of the set under one coin in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hold-04",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".......ooo",
    "......oo.oo",
    "......oo.oo",
    "......oo.oo",
    "....#..ooo",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
