import type { PixelIcon } from "../types";

// Fork, 12×12, in the style of `git-branch` (2026-11-17): square three-pixel nodes on top, one-pixel
// lines turning at right angles, the fork in the secondary tone. The two lines meet side by side
// into a four-pixel origin node, so the drawing is centred exactly (a three-pixel node under a
// one-pixel stem sat half a pixel off).
const icon: PixelIcon = {
  name: "git-fork",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###....ooo",
    ".#.#....o.o",
    ".###....ooo",
    "..#......o",
    "..####oooo",
    ".....#o",
    "....####",
    "....#..#",
    "....#..#",
    "....####",
  ],
};

export default icon;
