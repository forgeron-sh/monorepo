import type { PixelIcon } from "../types";

// Wi-Fi with a pen badge in the secondary tone, lower right: edit the network. Built on `wifi-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-pen",
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
    "..........oo",
    ".........ooo",
    ".....##.ooo",
    ".....##.oo",
    "........o",
  ],
};

export default icon;
