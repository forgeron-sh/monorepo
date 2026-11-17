import type { PixelIcon } from "../types";

// Gantt chart without axes: three staggered task bars, the middle one in the secondary tone; symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-no-axes-gantt",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".#####",
    ".#####",
    "",
    "...oooooo",
    "...oooooo",
    "",
    "......#####",
    "......#####",
  ],
};

export default icon;
