import type { PixelIcon } from "../types";

// Three people, one in front of two.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "group",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....####",
    ".oo.####.oo",
    ".oo..##..oo",
    "",
    ".oo..##..oo",
    "ooo.####.ooo",
    "ooo.####.ooo",
    "ooo.####.ooo",
    "ooo.####.ooo",
  ],
};

export default icon;
