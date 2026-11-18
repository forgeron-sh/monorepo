import type { PixelIcon } from "../types";

// Hand holding an open padlock: `hold-locked-01` with the shackle lifted on one side.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hold-locked-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......ooo",
    ".......o",
    "......ooooo",
    "......oo.oo",
    "......ooooo",
    "....#.ooooo",
    "#..#",
    "#.#########",
    "#.####",
    "#.########",
  ],
};

export default icon;
