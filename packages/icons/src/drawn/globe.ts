import type { PixelIcon } from "../types";

// Globe, 12×12: a ring, one meridian and a two-pixel equator in the secondary tone. Redrawn on
// 2026-11-16 by the protocol of docs/icons.md: the lab's `globe` (two meridians, two latitudes,
// one-pixel gaps everywhere) blurred into a scribble at 16 px.
const icon: PixelIcon = {
  name: "globe",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..###..###",
    "..#.#..#.#",
    ".#..#..#..#",
    ".#oooooooo#",
    ".#oooooooo#",
    ".#..#..#..#",
    "..#.#..#.#",
    "..###..###",
    "....####",
  ],
};

export default icon;
