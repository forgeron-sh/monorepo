import type { PixelIcon } from "../types";

// A weight with a tilde on it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "weight-tilde",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "....#..#",
    "..########",
    "..#......#",
    ".#........#",
    ".#..oo..o.#",
    "#..o..oo...#",
    "#..........#",
    "############",
  ],
};

export default icon;
