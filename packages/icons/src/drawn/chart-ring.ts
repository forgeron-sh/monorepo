import type { PixelIcon } from "../types";

// Donut chart: a two-pixel ring with one quarter in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-ring",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....#o",
    "...###ooo",
    "..####oooo",
    ".###....ooo",
    ".##......oo",
    "###......ooo",
    "###......###",
    ".##......##",
    ".###....###",
    "..########",
    "...######",
    ".....##",
  ],
};

export default icon;
