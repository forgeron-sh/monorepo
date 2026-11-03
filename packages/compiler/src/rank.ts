import type { Impact } from "@forgeron/manifest";

export const RANK: Record<Impact, number> = { none: 0, patch: 1, minor: 2, major: 3 };
