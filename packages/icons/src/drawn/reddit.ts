import type { PixelIcon } from "../types";

// The Reddit mark in pixels: the Snoo's head, eyes, smile and antenna cut out of the round bubble.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "reddit",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..#####..##",
    ".######..###",
    "#######.####",
    "####....####",
    "##........##",
    "#..##..##..#",
    "#..##..##..#",
    "##..####..##",
    ".##......##",
    ".#########",
    "######",
  ],
};

export default icon;
