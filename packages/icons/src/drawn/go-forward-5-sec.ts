import type { PixelIcon } from "../types";

// Go forward 5 seconds: an arc turning right with an arrowhead, over the number 5 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "go-forward-5-sec",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#.......###",
    "..........#",
    "",
    "....ooo",
    "....o",
    "....ooo",
    "......o",
    "....ooo",
  ],
};

export default icon;
