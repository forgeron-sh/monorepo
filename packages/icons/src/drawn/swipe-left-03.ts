import type { PixelIcon } from "../types";

// Two touch points, each with an arrow to the left in the secondary tone: `swipe-right-03` mirrored.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-left-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".o.......###",
    "oooooooo.###",
    ".o.......###",
    "",
    "",
    ".o.......###",
    "oooooooo.###",
    ".o.......###",
  ],
};

export default icon;
