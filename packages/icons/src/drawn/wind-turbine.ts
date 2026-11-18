import type { PixelIcon } from "../types";

// Wind turbine: three blades round a hub in the secondary tone, on a tower.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wind-turbine",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    ".....##",
    "....#oo#",
    "..##.oo.##",
    ".#...##...#",
    ".....##",
    ".....##",
    ".....##",
    ".....##",
    "....####",
  ],
};

export default icon;
