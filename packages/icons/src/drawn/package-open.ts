import type { PixelIcon } from "../types";

// Open box seen from the front with its two flaps folded out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "package-open",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "###......###",
    "#..#....#..#",
    ".#..#..#..#",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
