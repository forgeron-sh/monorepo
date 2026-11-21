import type { PixelIcon } from "../types";

// Four nodes linked through a central node, the hub in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "neural-network",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "##........##",
    "##........##",
    "..#......#",
    "...#....#",
    "....#oo#",
    "....#oo#",
    "...#....#",
    "..#......#",
    "##........##",
    "##........##",
  ],
};

export default icon;
