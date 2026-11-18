import type { PixelIcon } from "../types";

// Add to home screen: a wide phone with a plus in the secondary tone on its screen.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "screen-add-to-home-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..#######",
    "..#.....#",
    "..#.....#",
    "..#..o..#",
    "..#.ooo.#",
    "..#..o..#",
    "..#.....#",
    "..#.....#",
    "..#.....#",
    "..#######",
  ],
};

export default icon;
