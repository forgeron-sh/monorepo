import type { PixelIcon } from "../types";

// Bounding box: a square frame with a handle in the secondary tone at each corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bounding-box",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "ooo......ooo",
    "o.o######o.o",
    "ooo......ooo",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    "ooo......ooo",
    "o.o######o.o",
    "ooo......ooo",
  ],
};

export default icon;
