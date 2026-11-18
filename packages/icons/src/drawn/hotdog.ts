import type { PixelIcon } from "../types";

// Hot dog: a bun cut in two halves around a sausage that sticks out at both ends.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "hotdog",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...######",
    "..########",
    "",
    "oooooooooooo",
    "oooooooooooo",
    "",
    "..########",
    "...######",
  ],
};

export default icon;
