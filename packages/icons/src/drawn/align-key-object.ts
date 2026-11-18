import type { PixelIcon } from "../types";

// Two objects aligned on their left edge, the key object in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "align-key-object",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".oooooo",
    ".o....o",
    ".o....o",
    ".o....o",
    ".oooooo",
    "",
    ".#########",
    ".#.......#",
    ".#########",
  ],
};

export default icon;
