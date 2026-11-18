import type { PixelIcon } from "../types";

// External drive: a portable drive standing upright, with its cable plugged in at the bottom in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "external-drive",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "...######",
    "...#..#.#",
    "...######",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
