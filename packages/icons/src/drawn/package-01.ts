import type { PixelIcon } from "../types";

// Parcel seen from the front: a box with its lid seam, the tape on the lid in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "package-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#...oo...#",
    ".#...oo...#",
    ".##########",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
