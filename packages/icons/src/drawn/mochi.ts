import type { PixelIcon } from "../types";

// Kagami mochi: two stacked rice cakes with an orange on top in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "mochi",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....oooo",
    "...######",
    "..#......#",
    "..########",
    ".#........#",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
