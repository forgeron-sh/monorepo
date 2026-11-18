import type { PixelIcon } from "../types";

// Video camera: a body and the lens cone in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "video-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".#######..o",
    ".#.....#.oo",
    ".#.....#ooo",
    ".#.....#ooo",
    ".#.....#.oo",
    ".#######..o",
  ],
};

export default icon;
