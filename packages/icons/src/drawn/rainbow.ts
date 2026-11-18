import type { PixelIcon } from "../types";

// Rainbow: three adjoining arcs, the middle one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rainbow",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "....####",
    "..##oooo##",
    ".##o####o##",
    ".#o##..##o#",
    "#o##....##o#",
    "#o#......#o#",
  ],
};

export default icon;
