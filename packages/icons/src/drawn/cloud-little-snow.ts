import type { PixelIcon } from "../types";

// Cloud of `cloud-snow` with one flake instead of two.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-little-snow",
  implemented: true,
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
    ".....o",
    "....ooo",
    ".....o",
  ],
};

export default icon;
