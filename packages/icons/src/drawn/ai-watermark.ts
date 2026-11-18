import type { PixelIcon } from "../types";

// A water drop with an AI spark inside it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "ai-watermark",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....#..#",
    "...#....#",
    "..#......#",
    ".#........#",
    ".#...oo...#",
    "#...oooo...#",
    "#...oooo...#",
    "#....oo....#",
    ".#........#",
    "..##....##",
    "....####",
  ],
};

export default icon;
