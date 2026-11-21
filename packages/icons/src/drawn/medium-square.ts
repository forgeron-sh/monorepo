import type { PixelIcon } from "../types";

// The Medium mark cut out of a rounded square: the disc, the ellipse and the thin bar.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "medium-square",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "############",
    "############",
    "##..########",
    "#....#..#.##",
    "#....#..#.##",
    "#....#..#.##",
    "#....#..#.##",
    "##..########",
    "############",
    "############",
    ".##########",
  ],
};

export default icon;
