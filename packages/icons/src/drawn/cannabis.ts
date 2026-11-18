import type { PixelIcon } from "../types";

// Cannabis leaf: seven pointed leaflets fanning out from a short stem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "cannabis",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    ".....##",
    ".#...##...#",
    ".##..##..##",
    "..##.##.##",
    "...######",
    "####.##.####",
    "..##.##.##",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
