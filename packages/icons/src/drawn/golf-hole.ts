import type { PixelIcon } from "../types";

// Golf hole: a pin with a pennant in the secondary tone, standing in the hole.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "golf-hole",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....#oo",
    ".....#oooo",
    ".....#oo",
    ".....#",
    ".....#",
    ".....#",
    ".....#",
    "...######",
    ".##......##",
    "...######",
  ],
};

export default icon;
