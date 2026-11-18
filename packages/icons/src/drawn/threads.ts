import type { PixelIcon } from "../types";

// The Threads mark in pixels: the looped at sign, the stroke curling round into its inner bowl.
// 16×16: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "threads",
  implemented: true,
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    ".....######",
    "....##########",
    "...###......###",
    "..###........##",
    ".##...#####",
    ".##...##..##",
    ".##.......##",
    ".##...######",
    ".##..###..####",
    ".##..##....###",
    ".##..##...##.##",
    ".##...####...##",
    ".###........##",
    "..###......###",
    "...##########",
    ".....######",
  ],
};

export default icon;
