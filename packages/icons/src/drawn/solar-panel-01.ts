import type { PixelIcon } from "../types";

// Solar panel: a grid of cells on two splayed legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "solar-panel-01",
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
    "....#..#",
    "...#....#",
    "..#......#",
  ],
};

export default icon;
