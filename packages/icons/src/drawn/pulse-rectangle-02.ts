import type { PixelIcon } from "../types";

// Pulse in a rectangle: `rectangle-horizontal` crossed by a pulse line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pulse-rectangle-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..########",
    ".#........#",
    ".#..o.....#",
    ".#.o.o....#",
    "ooo...o.oooo",
    ".#.....o..#",
    ".#........#",
    "..########",
  ],
};

export default icon;
