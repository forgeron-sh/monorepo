import type { PixelIcon } from "../types";

// Cast: a screen with broadcast arcs in its lower-left corner in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cast",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    "..........#",
    ".ooo......#",
    "....o.....#",
    ".oo..o....#",
    "...o.o....#",
    ".o.o.o.####",
  ],
};

export default icon;
