import type { PixelIcon } from "../types";

// The Twitter bird: a solid bird with its beak raised and its wing swept back.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "twitter",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......###..#",
    "#....#######",
    "##...######",
    "###.#######",
    ".##########",
    ".#########",
    "..########",
    "...######",
    "#..#####",
    ".#####",
  ],
};

export default icon;
