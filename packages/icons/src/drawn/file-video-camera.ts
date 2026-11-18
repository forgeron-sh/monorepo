import type { PixelIcon } from "../types";

// File with a video camera badge: a body and its lens.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "file-video-camera",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".#####",
    ".#...##",
    ".#...#.#",
    ".#...####",
    ".#",
    ".#",
    ".#....ooo.o",
    ".#....ooooo",
    ".#....ooo.o",
    ".####",
  ],
};

export default icon;
