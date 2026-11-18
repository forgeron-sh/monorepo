import type { PixelIcon } from "../types";

// Wi-Fi of `wifi-unlock` with a location pin badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-location",
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
    "..#",
    ".........oo",
    "........o..o",
    ".....##.o..o",
    ".....##..oo",
    ".........oo",
  ],
};

export default icon;
