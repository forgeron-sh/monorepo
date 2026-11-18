import type { PixelIcon } from "../types";

// Bluetooth not connected: the Bluetooth rune with a cross badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bluetooth-not-connected",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "...##",
    "...#.#",
    ".#.##",
    "..##",
    "..##",
    ".#.##..o.o",
    "...#.#..o",
    "...##..o.o",
    "...#",
  ],
};

export default icon;
