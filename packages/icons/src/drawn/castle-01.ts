import type { PixelIcon } from "../types";

// Castle wall: three two-pixel merlons, a wall and an arched gate.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "castle-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    ".##..##..##",
    ".##########",
    ".#........#",
    ".#..####..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
