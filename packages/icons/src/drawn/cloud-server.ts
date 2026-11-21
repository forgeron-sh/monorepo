import type { PixelIcon } from "../types";

// Cloud above a server unit whose status light is in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-server",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "...##...#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..########",
    "",
    ".##########",
    ".#.oo.....#",
    ".##########",
  ],
};

export default icon;
