import type { PixelIcon } from "../types";

// Two footprints: a sole and a heel each, the right one a step ahead.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "footprints",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##",
    ".####",
    ".####",
    ".####....##",
    "..##....####",
    "........####",
    "..##....####",
    "..##.....##",
    "",
    ".........##",
    ".........##",
  ],
};

export default icon;
