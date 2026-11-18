import type { PixelIcon } from "../types";

// The Twitch mark: a speech bubble with a cut corner, two eyes and a tail.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "twitch",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#########",
    ".#........#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".#........#",
    ".#.......#",
    ".#......#",
    ".###.###",
    "...##",
  ],
};

export default icon;
