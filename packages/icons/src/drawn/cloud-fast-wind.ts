import type { PixelIcon } from "../types";

// Cloud of `rain` with two speed lines trailing to the left, in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-fast-wind",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "...##...#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..########",
    "",
    "oooooo",
    "",
    "..oooooo",
  ],
};

export default icon;
