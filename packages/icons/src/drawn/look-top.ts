import type { PixelIcon } from "../types";

// A round face looking up: the ring of `dollar-circle` with two eyes, in the secondary tone, near the top.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "look-top",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..##....##",
    ".#..o..o..#",
    ".#..o..o..#",
    "#..........#",
    "#..........#",
    "#..........#",
    "#..........#",
    ".#........#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
