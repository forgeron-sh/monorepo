import type { PixelIcon } from "../types";

// Three rows: a box split in three equal horizontal bands, after rows-2.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "rows3",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
