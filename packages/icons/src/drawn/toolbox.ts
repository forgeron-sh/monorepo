import type { PixelIcon } from "../types";

// Toolbox: a handle, a box, the lid line and the latch in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "toolbox",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    ".##########",
    ".#........#",
    ".####oo####",
    ".#...oo...#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
