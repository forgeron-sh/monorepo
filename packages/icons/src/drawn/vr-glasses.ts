import type { PixelIcon } from "../types";

// Virtual-reality headset seen from the front: visor with a nose notch, strap ends in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "vr-glasses",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..########",
    ".#........#",
    "o#........#o",
    "o#........#o",
    ".#...##...#",
    "..###..###",
  ],
};

export default icon;
