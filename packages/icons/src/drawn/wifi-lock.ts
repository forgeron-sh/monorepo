import type { PixelIcon } from "../types";

// Wi-Fi of `wifi-unlock` with a closed padlock badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-lock",
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
    "..#",
    ".........oo",
    "........o..o",
    ".....##.oooo",
    ".....##.oooo",
    "........oooo",
  ],
};

export default icon;
