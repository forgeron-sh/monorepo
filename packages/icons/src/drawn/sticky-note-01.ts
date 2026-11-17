import type { PixelIcon } from "../types";

// Sticky note: a square with its lower right corner folded, the fold in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sticky-note-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#.....ooo#",
    ".#.....oo#",
    ".#.....o#",
    ".#######",
  ],
};

export default icon;
