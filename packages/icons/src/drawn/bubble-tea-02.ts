import type { PixelIcon } from "../types";

// A bubble tea with a domed lid, straw and pearls.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "bubble-tea-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........#",
    ".......#",
    "...######",
    ".##......##",
    ".##########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#oo..oo#",
    "..#oo..oo#",
    "..########",
  ],
};

export default icon;
