import type { PixelIcon } from "../types";

// A sun rising behind a solar panel.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "solar-energy",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".o...oo...o",
    "..o......o",
    "....oooo",
    "...oooooo",
    "",
    ".##########",
    ".#..#..#..#",
    ".##########",
    ".#..#..#..#",
    ".##########",
    "....#..#",
    "...#....#",
  ],
};

export default icon;
