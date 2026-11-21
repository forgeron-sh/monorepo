import type { PixelIcon } from "../types";

// Scan: four corner brackets and the scan line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scan",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#........#",
    "",
    "..oooooooo",
    "..oooooooo",
    "",
    ".#........#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
