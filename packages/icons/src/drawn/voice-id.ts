import type { PixelIcon } from "../types";

// Voice ID: the corner brackets of `face-id` around three sound bars in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "voice-id",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#...o....#",
    ".#...o.o..#",
    ".#.o.o.o..#",
    ".#.o.o.o..#",
    ".#...o.o..#",
    ".#...o....#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
