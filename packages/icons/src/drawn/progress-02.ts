import type { PixelIcon } from "../types";

// Progress bar: a rounded bar about two thirds filled in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "progress-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##########",
    "#..........#",
    "#.oooooo...#",
    "#.oooooo...#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
