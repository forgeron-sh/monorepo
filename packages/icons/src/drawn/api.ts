import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`api`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "api",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "..#......#",
    "..#......#",
    "..#......#",
    ".#..o..o..#",
    ".#..o..o..#",
    "..#......#",
    "..#......#",
    "..#......#",
    "...##..##",
  ],
};

export default icon;
