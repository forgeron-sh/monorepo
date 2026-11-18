import type { PixelIcon } from "../types";

// Garden gnome: a tall pointed hat in the secondary tone over a nose and a pointed beard.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "gnome",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "....o..o",
    "....o..o",
    "...o....o",
    "...o....o",
    "..oooooooo",
    "..#..##..#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
