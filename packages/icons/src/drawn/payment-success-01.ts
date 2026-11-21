import type { PixelIcon } from "../types";

// Card with a check badge: `credit-card` cut for the badge, the stripe in the primary tone, the check in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "payment-success-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".##########",
    ".##########",
    ".#........#",
    ".#",
    ".#........o",
    ".####....o",
    "......o.o",
    ".......o",
  ],
};

export default icon;
