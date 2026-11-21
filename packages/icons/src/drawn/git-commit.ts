import type { PixelIcon } from "../types";

// Commit, in the style of the git icons: a round six-pixel node on a two-row line (a four-pixel node read as a
// small pill).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-commit",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....####",
    "...#....#",
    ".###....###",
    ".###....###",
    "...#....#",
    "....####",
  ],
};

export default icon;
