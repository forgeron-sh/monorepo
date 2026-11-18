import type { PixelIcon } from "../types";

// The `flag-01` flag with a chequered field in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "racing-flag",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#oo..oo#",
    "..#oo..oo#",
    "..#..oo..#",
    "..#..oo..#",
    "..########",
    "..#",
    "..#",
    "..#",
    "..#",
  ],
};

export default icon;
