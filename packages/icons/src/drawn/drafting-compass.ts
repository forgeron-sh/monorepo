import type { PixelIcon } from "../types";

// A drafting compass: a knob and hinge over two spread legs joined by an adjusting bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "drafting-compass",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    ".....##",
    "....#..#",
    "....#..#",
    "...#oooo#",
    "...#....#",
    "..#......#",
    "..#......#",
  ],
};

export default icon;
