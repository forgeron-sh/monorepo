import type { PixelIcon } from "../types";

// Wi-Fi arcs with a check in the secondary tone in place of the dot: connected. Built on `wifi-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-connected-01",
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
    "........o",
    "...o...o",
    "....o.o",
    ".....o",
  ],
};

export default icon;
