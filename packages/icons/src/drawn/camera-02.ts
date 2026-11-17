import type { PixelIcon } from "../types";

// Camera with its viewfinder bump on the left and a round lens in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
