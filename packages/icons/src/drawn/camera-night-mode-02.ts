import type { PixelIcon } from "../types";

// Camera of `camera-01` with a crescent moon in place of the lens: night mode.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-night-mode-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    ".##########",
    ".#........#",
    ".#...oo...#",
    ".#..oo....#",
    ".#..oo....#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
