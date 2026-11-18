import type { PixelIcon } from "../types";

// Chevron last: a right chevron against a bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chevron-last",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..##.....#",
    "...##....#",
    "....##...#",
    ".....##..#",
    ".....##..#",
    "....##...#",
    "...##....#",
    "..##.....#",
  ],
};

export default icon;
