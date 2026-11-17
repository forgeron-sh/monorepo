import type { PixelIcon } from "../types";

// Wi-Fi: two arcs over a dot, two-row gaps.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the dot.
const icon: PixelIcon = {
  name: "wifi-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    ".##......##",
    "#..........#",
    "",
    "...######",
    "..#......#",
    "",
    "",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
