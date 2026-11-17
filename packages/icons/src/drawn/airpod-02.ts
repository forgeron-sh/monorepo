import type { PixelIcon } from "../types";

// Earbuds case: a rounded charging case with the lid seam and a status light.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "airpod-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".##########",
    ".#........#",
    ".#...##...#",
    ".#........#",
    "..#......#",
    "...######",
  ],
};

export default icon;
