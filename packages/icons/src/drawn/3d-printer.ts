import type { PixelIcon } from "../types";

// 3D printer: a frame, the nozzle hanging from the gantry, the printed part in the secondary tone on the bed.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "3d-printer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#..####..#",
    ".#...##...#",
    ".#........#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".#..oooo..#",
    ".##########",
    ".#........#",
    ".##########",
  ],
};

export default icon;
