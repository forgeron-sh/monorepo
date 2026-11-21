import type { PixelIcon } from "../types";

// Recovery mail: the envelope of mail-add-01 with a circular arrow badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "recovery-mail",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".##......##",
    ".#.##..##.#",
    ".#...##...#",
    ".#",
    ".#......ooo",
    ".#.....o...o",
    ".####.ooo..o",
    "...........o",
    "........ooo",
  ],
};

export default icon;
