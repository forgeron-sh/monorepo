import type { PixelIcon } from "../types";

// A worm wriggling in a wave.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "worm",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..##......##",
    ".####....###",
    "##..##..##",
    "#....####",
    "......##",
  ],
};

export default icon;
