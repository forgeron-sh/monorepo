import type { PixelIcon } from "../types";

// Calendar fold: the calendar of calendar-01 with its lower-right corner folded, the flap in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "calendar-fold",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#.....ooo#",
    ".#.....o.#",
    ".#.....o#",
    ".#######",
  ],
};

export default icon;
