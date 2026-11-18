import type { PixelIcon } from "../types";

// The Snapchat mark in pixels: the ghost with its round head, its two little arms and its ragged
// hem.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "snapchat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...######",
    "...######",
    "...######",
    ".##########",
    "..########",
    "..########",
    ".##########",
    "############",
    "..########",
    ".....##",
  ],
};

export default icon;
