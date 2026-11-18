import type { PixelIcon } from "../types";

// SMS code: a phone with a message bubble of dots as a badge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sms-code",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".######",
    ".#....#",
    ".#....#",
    ".#....#",
    ".#",
    ".#",
    ".#....ooooo",
    ".#.##.o.o.o",
    ".#....ooooo",
    ".####.o",
  ],
};

export default icon;
