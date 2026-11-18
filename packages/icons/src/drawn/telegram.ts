import type { PixelIcon } from "../types";

// The Telegram mark in pixels: the paper plane cut out of the round disc.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "telegram",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "..########",
    ".##########",
    ".########.#",
    "######....##",
    "###......###",
    "##......####",
    "#####...####",
    ".#####.####",
    ".##########",
    "..########",
    "....####",
  ],
};

export default icon;
