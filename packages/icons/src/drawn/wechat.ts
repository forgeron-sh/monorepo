import type { PixelIcon } from "../types";

// The WeChat mark: a large speech bubble with two eyes, overlapped by a smaller one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wechat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    "#......#",
    "#.#..#.#",
    "#......#",
    "#....oooooo",
    ".###o......o",
    ".#..o.o..o.o",
    "....o......o",
    ".....oooooo",
    ".........oo",
  ],
};

export default icon;
