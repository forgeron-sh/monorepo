import type { PixelIcon } from "../types";

// Space bar: a wide key with the space symbol.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "space",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##########",
    "#..........#",
    "#..o....o..#",
    "#..oooooo..#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
