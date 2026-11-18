import type { PixelIcon } from "../types";

// Flask: a neck, a cone, the liquid in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flask-conical",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "....#..#",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#oooooooo#",
    ".#oooooooo#",
    ".#oooooooo#",
    ".##########",
  ],
};

export default icon;
