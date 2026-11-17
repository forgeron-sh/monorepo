import type { PixelIcon } from "../types";

// Lorry of `truck` carrying a solid parcel in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "delivery-truck-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#######",
    ".#.....#",
    ".#.ooo.###",
    ".#.ooo.#..#",
    ".#.ooo.#..#",
    ".##########",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
