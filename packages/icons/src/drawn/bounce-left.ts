import type { PixelIcon } from "../types";

// Bounce left: a ball bouncing to the left: two arcs and the ball.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bounce-left",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "oo",
    "oo",
    "........##",
    "..#....#..#",
    "..#....#..#",
    "...#..#....#",
    "...#..#....#",
    "....##.....#",
    "...........#",
  ],
};

export default icon;
