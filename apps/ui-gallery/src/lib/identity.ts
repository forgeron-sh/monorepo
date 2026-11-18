import tokens from "../../../../assets/design-system/tokens.json";

// The Identity pages read the source of the tokens (assets/design-system/tokens.json), the same
// file packages/ui/tokens/tokens.css is generated from: what is shown is what ships.

export const identity = [
  { slug: "logo", name: "Logo", summary: "The anvil on its 12-pixel grid, and the wordmark." },
  { slug: "colors", name: "Colours", summary: "Near-black, greys, one ember, three states." },
  {
    slug: "typography",
    name: "Typography",
    summary: "The pixel face for titles, Geist for the rest.",
  },
  { slug: "tokens", name: "Tokens", summary: "Space, borders, corners, motion, the one shadow." },
] as const;

export interface ColorToken {
  name: string;
  value: { dark: string; light: string };
  usage: string;
}

interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight: string;
  fontWeight: number;
  textTransform?: string;
  letterSpacing?: string;
  sample?: string;
  usage?: string;
}

export interface TypeGroup {
  name: string;
  family: string;
  note?: string;
  styles: TypeStyle[];
}

export interface PlainToken {
  name: string;
  value: string | { dark: string; light: string };
  usage: string;
}

export const colors = tokens.color.tokens as ColorToken[];
export const typeGroups = tokens.type.groups as TypeGroup[];
export const families = tokens.type.families as Record<string, string>;
export const scales: Array<{ title: string; note?: string; tokens: PlainToken[] }> = [
  { title: "Spacing", tokens: tokens.spacing.tokens as PlainToken[] },
  { title: "Layout", tokens: tokens.layout.tokens as PlainToken[] },
  { title: "Corners", tokens: tokens.radius.tokens as PlainToken[] },
  { title: "Borders", tokens: tokens.border.tokens as PlainToken[] },
  { title: "Motion", note: tokens.motion.note, tokens: tokens.motion.tokens as PlainToken[] },
  { title: "Shadow", note: tokens.shadow.note, tokens: tokens.shadow.tokens as PlainToken[] },
];
