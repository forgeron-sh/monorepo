import type { PixelIcon } from "../types";

// The Quora mark in pixels: the round Q with its tail running out at the lower right.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "quora",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    "..########",
    ".###....###",
    "###......###",
    "##........##",
    "##........##",
    "##........##",
    "###...##.###",
    ".###..#####",
    "..#########",
    "...#########",
    ".........###",
  ],
};

export default icon;
