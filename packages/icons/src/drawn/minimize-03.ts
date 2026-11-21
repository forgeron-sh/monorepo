import type { PixelIcon } from "../types";

// Minimise: four corner brackets turned inwards, `maximize-03` inside out.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "minimize-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#....#",
    "...#....#",
    ".###....###",
    "",
    "",
    "",
    "",
    ".###....###",
    "...#....#",
    "...#....#",
  ],
};

export default icon;
