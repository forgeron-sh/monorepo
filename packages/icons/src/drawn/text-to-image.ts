import type { PixelIcon } from "../types";

// Text to image: a picture frame with mountains, and a letter T, in the secondary tone, in place of the sun; the frame of image-01.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-to-image",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#.ooo....#",
    ".#..o.....#",
    ".#..o.....#",
    ".#........#",
    ".#...#....#",
    ".#..###.#.#",
    ".#.########",
    ".##########",
  ],
};

export default icon;
