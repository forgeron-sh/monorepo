import type { PixelIcon } from "../types";

// The Messenger mark in pixels: a round speech balloon with the zigzag bolt cut out of it and its
// tail at the lower left.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "messenger",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...######",
    ".##########",
    ".##########",
    "############",
    "####.###..##",
    "###...#..###",
    "##..#...####",
    "############",
    ".##########",
    ".##########",
    ".########",
    ".##",
  ],
};

export default icon;
