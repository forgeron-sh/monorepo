import type { PixelIcon } from "../types";

// Go forward 15 seconds: an arc turning right with an arrowhead, over the number 15 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "go-forward-15-sec",
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
    "...o..ooo",
    "..oo..o",
    "...o..ooo",
    "...o....o",
    "..ooo.ooo",
  ],
};

export default icon;
