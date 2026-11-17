import type { PixelIcon } from "../types";

// House with a gable roof overhanging the walls, a window and a door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "house-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "...##..##",
    ".##......##",
    "############",
    ".#........#",
    ".#.oo.....#",
    ".#.oo..##.#",
    ".#....#..##",
    ".#....#..##",
    ".######..##",
  ],
};

export default icon;
