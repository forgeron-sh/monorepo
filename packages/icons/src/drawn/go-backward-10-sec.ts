import type { PixelIcon } from "../types";

// Go back 10 seconds: an arc turning left with an arrowhead, over the number 10 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "go-backward-10-sec",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    "###.......#",
    ".#",
    "",
    "...o..ooo",
    "..oo..o.o",
    "...o..o.o",
    "...o..o.o",
    "..ooo.ooo",
  ],
};

export default icon;
