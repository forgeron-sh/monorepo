import type { PixelIcon } from "../types";

// The cloud of `cloud-fast-wind` with short, slow wind strokes.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cloud-slow-wind",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....###",
    "...##...#",
    "..#......#",
    ".#........#",
    ".#........#",
    "..########",
    "",
    "ooo..ooo",
    "",
    "..ooo",
  ],
};

export default icon;
