import type { PixelIcon } from "../types";

// Push-up bar from the side: a padded grip in the secondary tone on two splayed legs.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "push-up-bar",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##########",
    ".#oooooooo#",
    ".##########",
    "..#......#",
    "..#......#",
    ".#........#",
    ".#........#",
    "###......###",
  ],
};

export default icon;
