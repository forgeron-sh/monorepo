import type { PixelIcon } from "../types";

// Dashboard: four panels of different heights, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the two short panels, keeping the half-turn symmetry.
const icon: PixelIcon = {
  name: "dashboard-square-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####..oooo",
    ".#..#..o..o",
    ".#..#..oooo",
    ".#..#",
    ".####",
    ".......####",
    ".......#..#",
    ".oooo..#..#",
    ".o..o..#..#",
    ".oooo..####",
  ],
};

export default icon;
