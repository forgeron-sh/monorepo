import type { PixelIcon } from "../types";

// Bubble chart: axes with one large ring and two small solid bubbles.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-bubble-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#.....##",
    ".#....#..#",
    ".#....#..#",
    ".#.....##",
    ".#",
    ".#..##...##",
    ".#..##...##",
    ".#",
    ".##########",
  ],
};

export default icon;
