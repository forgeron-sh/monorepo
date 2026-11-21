import type { PixelIcon } from "../types";

// Police cap from the front: a wide crown with the badge in the secondary tone, a band, a peak.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "police-cap",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".##########",
    "#..........#",
    ".#...oo...#",
    "..#..oo..#",
    "..########",
    "..#......#",
    ".##########",
  ],
};

export default icon;
