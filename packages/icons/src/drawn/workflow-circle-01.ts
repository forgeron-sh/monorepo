import type { PixelIcon } from "../types";

// Workflow: two round nodes joined by an elbow, the second in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "workflow-circle-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###",
    ".#...#",
    ".#...####",
    ".#...#..#",
    "..###...#",
    "........#",
    ".......ooo",
    "......o...o",
    "......o...o",
    "......o...o",
    ".......ooo",
  ],
};

export default icon;
