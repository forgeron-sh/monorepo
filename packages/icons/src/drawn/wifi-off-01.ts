import type { PixelIcon } from "../types";

// Wi-Fi off: the arcs and dot of `wifi-01` struck by a 45° slash in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-off-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o.######",
    ".#o......##",
    "#..o.......#",
    "....o",
    "...##o###",
    "..#...o..#",
    ".......o",
    "........o",
    ".....##..o",
    ".....##...o",
    "...........o",
  ],
};

export default icon;
