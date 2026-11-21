import type { PixelIcon } from "../types";

// Two beamed notes, the heads solid.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "music-note-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#######",
    "....#.....#",
    "....#.....#",
    "....#.....#",
    "....#.....#",
    "....#.....#",
    "....#.....#",
    "..###...###",
    ".####..####",
    ".###...###",
  ],
};

export default icon;
