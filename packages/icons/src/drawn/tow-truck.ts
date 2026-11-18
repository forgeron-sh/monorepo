import type { PixelIcon } from "../types";

// A tow truck: a cab, a bed and a boom with a hook at the back.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tow-truck",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".ooo",
    ".o..o",
    ".o...o",
    ".o....o.###",
    "oo.....o#..#",
    "........#..#",
    ".##########",
    "..oo....oo",
    "..oo....oo",
  ],
};

export default icon;
