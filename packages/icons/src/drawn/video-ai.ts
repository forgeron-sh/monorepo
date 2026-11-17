import type { PixelIcon } from "../types";

// AI video: the camera of `video-01`, a sparkle in the secondary tone inside the body.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "video-ai",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#######..#",
    ".#..o..#.##",
    ".#.ooo.####",
    ".#..o..####",
    ".#.....#.##",
    ".#######..#",
  ],
};

export default icon;
