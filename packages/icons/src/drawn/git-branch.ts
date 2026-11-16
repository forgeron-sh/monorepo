import type { PixelIcon } from "../types";

// Ported from the site's lab icons (`branch`), 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "git-branch",
  implemented: true,
  style: "pixel",
  grid: 12,
  rows: [
    "",
    "..##....oo",
    "..##....oo",
    "..#......o",
    "..#......o",
    "..#.....o",
    "..#...oo",
    "..#.oo",
    "..##",
    ".####",
    ".####",
  ],
};

export default icon;
