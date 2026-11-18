import type { PixelIcon } from "../types";

// Bluetooth connected: the Bluetooth rune with a dot on each side in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bluetooth-connected",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#",
    ".....##",
    ".....#.#",
    "...#.##",
    "oo..##...oo",
    "oo..##...oo",
    "...#.##",
    ".....#.#",
    ".....##",
    ".....#",
  ],
};

export default icon;
