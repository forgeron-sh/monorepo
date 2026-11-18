import type { PixelIcon } from "../types";

// Camera of `camera-add-02` with the counter-clockwise arrow badge of `image-counter-clockwise` in the lower right corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "camera-rotated-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###",
    "##########",
    "#........#",
    "#...##...#",
    "#..#..#..#",
    "#..#..#",
    "#...##...oo",
    "#.......o..o",
    "######.ooo.o",
    "........o..o",
    "..........o",
  ],
};

export default icon;
