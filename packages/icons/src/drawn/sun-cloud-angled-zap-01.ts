import type { PixelIcon } from "../types";

// The sun and cloud of the set with a lightning bolt below.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sun-cloud-angled-zap-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..ooo",
    ".ooooo",
    ".ooooo",
    ".ooo..###",
    "....##...#",
    "...#......#",
    "...#......#",
    "....######",
    "........o",
    "......ooo",
    "......o",
    ".....o",
  ],
};

export default icon;
