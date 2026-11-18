import type { PixelIcon } from "../types";

// Bounce right: a ball bouncing to the right: two arcs and the ball.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bounce-right",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........oo",
    "..........oo",
    "..##",
    ".#..#....#",
    ".#..#....#",
    "#....#..#",
    "#....#..#",
    "#.....##",
    "#",
  ],
};

export default icon;
