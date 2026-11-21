import type { PixelIcon } from "../types";

// Broken bone: a bone with a jagged crack through its middle in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "broken-bone",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##......##",
    "#..###.##..#",
    ".#....o...#",
    ".#...o....#",
    "#..##.###..#",
    ".##......##",
  ],
};

export default icon;
