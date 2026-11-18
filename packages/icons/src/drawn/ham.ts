import type { PixelIcon } from "../types";

// Ham: a leg of ham with the bone end in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ham",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####",
    ".#######",
    "#########",
    "##########",
    "##########",
    ".#########",
    "..#######",
    "....#####",
    ".......oo",
    "........ooo",
    ".........oo",
  ],
};

export default icon;
