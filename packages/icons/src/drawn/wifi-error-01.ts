import type { PixelIcon } from "../types";

// Wi-Fi arcs over an exclamation mark in the secondary tone, a connection problem.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-error-01",
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
    ".....oo",
    ".....oo",
    "",
    ".....oo",
  ],
};

export default icon;
