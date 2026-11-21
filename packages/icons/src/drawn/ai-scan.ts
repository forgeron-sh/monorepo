import type { PixelIcon } from "../types";

// AI scan: the corners of `scan` and a scan line, the AI sparkle badge in the fourth corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ai-scan",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....###",
    ".#........#",
    ".#........#",
    "",
    "..########",
    "",
    ".........o",
    ".#......ooo",
    ".#.....ooooo",
    ".###....ooo",
    ".........o",
  ],
};

export default icon;
