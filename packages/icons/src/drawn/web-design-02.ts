import type { PixelIcon } from "../types";

// Web design: the browser window of `web-design-01` cut back around a pencil in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "web-design-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".#........#",
    ".#",
    ".#.......oo",
    ".#......o.o",
    ".#.....o.o",
    ".#....o.o",
    ".####.oo",
  ],
};

export default icon;
