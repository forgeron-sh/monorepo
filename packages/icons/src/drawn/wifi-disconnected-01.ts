import type { PixelIcon } from "../types";

// Wi-Fi arcs with a cross in the secondary tone in place of the dot: disconnected. Built on `wifi-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-disconnected-01",
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
    "....o..o",
    ".....oo",
    ".....oo",
    "....o..o",
  ],
};

export default icon;
