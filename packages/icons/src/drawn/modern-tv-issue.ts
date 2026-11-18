import type { PixelIcon } from "../types";

// Flat screen on a stand with an exclamation mark in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "modern-tv-issue",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#..........#",
    "#..........#",
    "#",
    "#.........o",
    "#.........o",
    "########..o",
    ".....##",
    "...######.o",
  ],
};

export default icon;
