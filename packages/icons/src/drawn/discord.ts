import type { PixelIcon } from "../types";

// The Discord mark: the rounded head of Clyde with two eyes and two feet.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "discord",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    ".##########",
    ".##########",
    "############",
    "###..##..###",
    "###..##..###",
    "############",
    "############",
    ".###....###",
    "..#......#",
  ],
};

export default icon;
