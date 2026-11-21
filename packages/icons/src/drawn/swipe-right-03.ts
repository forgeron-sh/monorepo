import type { PixelIcon } from "../types";

// Two touch points, each with an arrow to the right in the secondary tone: a two-finger swipe right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swipe-right-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "###.......o",
    "###.oooooooo",
    "###.......o",
    "",
    "",
    "###.......o",
    "###.oooooooo",
    "###.......o",
  ],
};

export default icon;
