import type { PixelIcon } from "../types";

// Pulse line in a box, a vital-signs monitor; the line in the secondary tone: flat, a peak, a dip, flat.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pulse-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    ".#...o....#",
    ".#..o.o...#",
    ".#oo...o.o#",
    ".#......o.#",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
