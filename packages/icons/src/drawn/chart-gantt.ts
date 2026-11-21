import type { PixelIcon } from "../types";

// Gantt chart: three staggered task bars on a time axis, the middle one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-gantt",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#",
    ".#.####",
    ".#.####",
    ".#",
    ".#...oooo",
    ".#...oooo",
    ".#",
    ".#......###",
    ".#......###",
    ".##########",
  ],
};

export default icon;
