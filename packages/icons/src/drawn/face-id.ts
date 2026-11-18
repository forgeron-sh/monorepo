import type { PixelIcon } from "../types";

// Face recognition: four corner brackets around a face in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "face-id",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#........#",
    "....o..o",
    "....o..o",
    "",
    "....o..o",
    ".#...oo...#",
    ".#........#",
    ".###....###",
  ],
};

export default icon;
