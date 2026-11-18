import type { PixelIcon } from "../types";

// Pen tool nib pointing up, with its slit hole and holder band.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pen-tool-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "...#....#",
    "...#....#",
    "..#..##..#",
    "..#..##..#",
    "..#......#",
    "...#....#",
    "...######",
    "...#....#",
    "...######",
  ],
};

export default icon;
