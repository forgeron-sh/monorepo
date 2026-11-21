import type { PixelIcon } from "../types";

// Badge: a scalloped seal outline, empty.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badge",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..###..###",
    "..#......#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..#......#",
    "..#......#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
