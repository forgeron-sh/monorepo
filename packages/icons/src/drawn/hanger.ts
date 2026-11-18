import type { PixelIcon } from "../types";

// Clothes hanger: a curled hook over a wide triangle.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hanger",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "....#..#",
    ".......#",
    "......#",
    ".....##",
    "...##..##",
    ".##......##",
    ".##########",
  ],
};

export default icon;
