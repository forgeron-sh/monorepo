import type { PixelIcon } from "../types";

// Webcam: a round camera with its lens in the secondary tone, on a stand.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "webcam",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...##...#",
    ".#..#oo#..#",
    ".#..#oo#..#",
    ".#...##...#",
    "..#......#",
    "...######",
    ".....##",
    "...######",
  ],
};

export default icon;
