import type { PixelIcon } from "../types";

// Three by three grid in a frame.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "grid",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
    ".#..#..#..#",
    ".#..#..#..#",
    ".##########",
  ],
};

export default icon;
