import type { PixelIcon } from "../types";

// Bluetooth rune with the magnifier badge of `file-search`, searching for devices.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bluetooth-search",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#",
    "..##",
    "#.#.#",
    ".###",
    ".###",
    "#.#.#.ooo",
    "..##..o.o",
    "..#...ooo",
    ".........o",
    "..........o",
  ],
};

export default icon;
