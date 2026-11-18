import type { PixelIcon } from "../types";

// The Zsh logo in pixels: the terminal window with its title bar, the "%" prompt and its cursor
// in the top left, and the "z" of the wordmark breaking out of the lower right corner of the frame.
// Rasterised from the reference `simple-icons:zsh` (Iconify, 2026-11-18), then redrawn by hand:
// the three letters "zsh" fall below one pixel, so only the "z" is kept, four pixels square.
// Zsh and the Zsh logo are trademarks of their owners, used here only to refer to Zsh.
// 12×12: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "zsh",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".##########",
    "#..........#",
    "############",
    "#..........#",
    "#.#..#.....#",
    "#...#......#",
    "#..#.......#",
    "#.#..#.##",
    "#.......####",
    "#.........#",
    "#........#",
    ".######.####",
  ],
};

export default icon;
