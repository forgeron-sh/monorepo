import type { PixelIcon } from "../types";

// The LinkedIn mark in pixels: the letters in cut out of a rounded square.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "linkedin-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "##..########",
    "##..########",
    "############",
    "##..#....###",
    "##..#.....##",
    "##..#..#..##",
    "##..#..#..##",
    "##..#..#..##",
    "############",
    ".##########",
  ],
};

export default icon;
