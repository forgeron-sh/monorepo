import type { PixelIcon } from "../types";

// A cloud above a wifi sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wireless-cloud-access",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....###",
    "...##...#",
    ".##......#",
    "#.........#",
    ".#########",
    "",
    "...oooooo",
    "..o......o",
    "....oooo",
    "...o....o",
    "",
    ".....oo",
  ],
};

export default icon;
