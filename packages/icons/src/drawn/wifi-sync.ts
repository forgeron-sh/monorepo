import type { PixelIcon } from "../types";

// Wi-Fi sync: the arcs of `wifi-lock` with the sync badge of `cloud-sync`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-sync",
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
    "........ooo",
    ".......o...o",
    "....##.oo..o",
    "....##.o..oo",
    "........ooo",
  ],
};

export default icon;
