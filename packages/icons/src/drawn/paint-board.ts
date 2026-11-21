import type { PixelIcon } from "../types";

// Painter's palette: a kidney-shaped board with a notch, three dabs of paint in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "paint-board",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....#####",
    "..##.....##",
    ".#.oo......#",
    "#..oo..oo..#",
    "#......oo..#",
    "#.oo.....##",
    "#.oo....#",
    "#.......#",
    ".#.......##",
    "..#########",
  ],
};

export default icon;
