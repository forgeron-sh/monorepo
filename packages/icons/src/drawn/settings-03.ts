import type { PixelIcon } from "../types";

// Vertical sliders: two tracks and their knobs in the secondary tone, `sliders-horizontal` turned a quarter, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "settings-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    "...#....#",
    "...#...ooo",
    "...#...ooo",
    "...#....#",
    "...#....#",
    "..ooo...#",
    "..ooo...#",
    "...#....#",
    "...#....#",
  ],
};

export default icon;
