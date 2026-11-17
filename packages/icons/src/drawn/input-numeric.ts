import type { PixelIcon } from "../types";

// Numeric input: a field with the digits `12` in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "input-numeric",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "#..........#",
    "#..oo.ooo..#",
    "#...o...o..#",
    "#...o..o...#",
    "#...o.ooo..#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
