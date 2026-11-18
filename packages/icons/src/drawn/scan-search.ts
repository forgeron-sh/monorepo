import type { PixelIcon } from "../types";

// Scan and search: the brackets of `scan` round a small magnifier in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scan-search",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#..ooo...#",
    "...o...o",
    "...o...o",
    "...o...o",
    "....ooo.o",
    ".#......o.#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
