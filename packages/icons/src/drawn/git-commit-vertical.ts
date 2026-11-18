import type { PixelIcon } from "../types";

// Commit on a vertical line: `git-commit` turned a quarter turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-commit-vertical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "....####",
    "...#....#",
    "...#....#",
    "...#....#",
    "...#....#",
    "....####",
    ".....##",
    ".....##",
  ],
};

export default icon;
