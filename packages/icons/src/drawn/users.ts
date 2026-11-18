import type { PixelIcon } from "../types";

// Two people: one in front lower left, the other behind upper right in the secondary tone, hidden by
// the first and a one-pixel clearance, like the bubbles of `chatting-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "users",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........oo",
    ".......o..o",
    "..##...o..o",
    ".#..#...oo",
    ".#..#",
    "..##...oooo",
    "...........o",
    ".####......o",
    "#....#.....o",
    "######.ooooo",
  ],
};

export default icon;
