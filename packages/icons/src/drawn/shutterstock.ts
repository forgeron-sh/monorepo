import type { PixelIcon } from "../types";

// The Shutterstock mark in pixels: two thick corners facing each other, top left and bottom right.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "shutterstock",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#####",
    ".######",
    ".######",
    ".###",
    ".###",
    ".###",
    "........###",
    "........###",
    "........###",
    ".....######",
    ".....######",
    ".....#####",
  ],
};

export default icon;
