import type { PixelIcon } from "../types";

// Stepped pyramid: three square steps in outline, the top step in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pyramid-structure-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....oooo",
    "....o..o",
    "..###..###",
    "..#......#",
    "###......###",
    "#..........#",
    "#..........#",
    "############",
  ],
};

export default icon;
