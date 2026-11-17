import type { PixelIcon } from "../types";

// Go back 60 seconds: an arc turning left with an arrowhead, over the number 60 in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "go-backward-60-sec",
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
    "..ooo.ooo",
    "..o...o.o",
    "..ooo.o.o",
    "..o.o.o.o",
    "..ooo.ooo",
  ],
};

export default icon;
