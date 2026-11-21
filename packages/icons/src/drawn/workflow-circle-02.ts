import type { PixelIcon } from "../types";

// Workflow: a round start node in the secondary tone branching to two round nodes. Built on `workflow-circle-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "workflow-circle-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........###",
    ".......#...#",
    ".......#...#",
    ".ooo...#...#",
    "o...o...###",
    "o...o#####",
    "o...o....#",
    ".ooo....###",
    ".......#...#",
    ".......#...#",
    ".......#...#",
    "........###",
  ],
};

export default icon;
