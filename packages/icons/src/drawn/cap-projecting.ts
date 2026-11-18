import type { PixelIcon } from "../types";

// Projecting line cap: the stroke outline runs past its end point, drawn as a dot in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cap-projecting",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    ".#",
    ".#.ooo",
    ".#.ooo#####",
    ".#.ooo",
    ".#",
    ".##########",
  ],
};

export default icon;
