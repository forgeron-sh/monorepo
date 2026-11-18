import type { PixelIcon } from "../types";

// The TikTok mark in pixels: the musical note with its curling flag.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tiktok",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "......##",
    "......###",
    "......####",
    "......######",
    "...##.##..##",
    "..###.##",
    ".####.##",
    ".##...##",
    ".##...##",
    ".##..###",
    ".#######",
    "..####",
  ],
};

export default icon;
