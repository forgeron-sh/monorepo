import type { PixelIcon } from "../types";

// Wi-Fi unlocked: `wifi-01` with an open padlock badge in the secondary tone, lower right.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-unlock",
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
    "........ooo",
    "........o",
    ".....##.oooo",
    ".....##.oooo",
    "........oooo",
  ],
};

export default icon;
