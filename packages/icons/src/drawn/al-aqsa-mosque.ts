import type { PixelIcon } from "../types";

// Dome of the Rock: a dome in the secondary tone on a drum, over a wide octagonal hall with an arched door.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "al-aqsa-mosque",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oooo",
    "...o....o",
    "..o......o",
    "..########",
    "..#......#",
    "############",
    "#..........#",
    "#....##....#",
    "#...#..#...#",
    "#...#..#...#",
    "#####..#####",
  ],
};

export default icon;
