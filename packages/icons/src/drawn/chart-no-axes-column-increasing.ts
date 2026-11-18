import type { PixelIcon } from "../types";

// Column chart without axes: three solid columns getting taller.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-no-axes-column-increasing",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........##",
    ".........##",
    ".........##",
    ".....##..##",
    ".....##..##",
    ".....##..##",
    ".##..##..##",
    ".##..##..##",
    ".##..##..##",
    ".##..##..##",
  ],
};

export default icon;
