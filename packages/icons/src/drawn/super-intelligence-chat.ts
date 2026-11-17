import type { PixelIcon } from "../types";

// Chat bubble with the S I badge of super intelligence at the lower right, in the secondary tone; the bubble of ai-chat-01.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "super-intelligence-chat",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    "#........#",
    "#........#",
    "#........#",
    "#........#",
    "#",
    ".#..##.ooo.o",
    ".#.#...o...o",
    ".##....ooo.o",
    ".........o.o",
    ".......ooo.o",
  ],
};

export default icon;
