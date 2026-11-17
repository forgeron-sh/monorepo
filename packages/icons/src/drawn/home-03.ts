import type { PixelIcon } from "../types";

// House, third style: the roof of `home-01` with a chimney, and a window in the secondary tone
// instead of the door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "home-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##.##",
    "....#..###",
    "...#....##",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
