// The data shape of an icon. Icon modules hold plain data (no function call at module level), so a
// bundler drops every icon a consumer does not import.

/**
 * A pixel icon on a square grid. Each row is one line of the grid: `#` is a pixel in the primary
 * tone, `o` a pixel in the secondary tone, anything else is empty. Rows shorter than the grid are
 * padded; missing rows are empty.
 */
export interface PixelIcon {
  readonly name: string;
  readonly implemented: true;
  readonly style: "pixel";
  readonly grid: number;
  readonly rows: readonly string[];
}

/** A catalog name with no drawing yet: renders nothing. */
export interface StubIcon {
  readonly name: string;
  readonly implemented: false;
}

/**
 * Every drawing is a pixel icon: the design language of the site's lab. `style` is kept as the
 * discriminant, so a second style can be added without breaking the data.
 */
export type DrawnIcon = PixelIcon;
export type IconDefinition = DrawnIcon | StubIcon;

/** Monotone: every shape in the primary tone. Duotone: the secondary shapes in the secondary tone. */
export type IconVariant = "mono" | "duo";

export interface IconRenderOptions {
  variant?: IconVariant;
  /** Width and height in px. Default 24. */
  size?: number | string;
  /** Primary tone. Default `currentColor`. */
  color?: string;
  /**
   * Secondary tone of the duotone variant. Default: the CSS variable `--icon-secondary`, falling
   * back to the primary tone.
   */
  secondaryColor?: string;
  /**
   * Opacity of the secondary tone. Default: 1 when `secondaryColor` is given, otherwise the CSS
   * variable `--icon-secondary-opacity`, falling back to 0.4.
   */
  secondaryOpacity?: number;
  /** Accessible name. Without one the icon is decorative (`aria-hidden`). */
  title?: string;
}

/** Where the name of a catalog entry comes from. */
export type IconSource = "hugeicons" | "forgeron";

/** One entry of the generated manifest (`@forgeron/icons/catalog`). */
export interface IconManifestEntry {
  /** Kebab-case name, the key of the catalog. */
  readonly name: string;
  /** The named export of `@forgeron/icons`. */
  readonly export: string;
  /** `hugeicons`: a name of the Hugeicons list (name only, our drawing); `forgeron`: our own. */
  readonly source: IconSource;
  /** Our own taxonomy, derived from the name (see the package README). */
  readonly category: string;
  /** Search tags. */
  readonly labels: readonly string[];
  readonly description: string;
  readonly implemented: boolean;
  readonly variants: { readonly mono: boolean; readonly duo: boolean };
  readonly style: DrawnIcon["style"] | null;
  /** Other names that lead to this entry (Hugeicons aliases, names used before the package). */
  readonly aliases: readonly string[];
  /** What the drawing was redrawn after (inspiration, never traced), when it was. */
  readonly reference: string | null;
  /** For a third-party brand icon: whose trademark it is and how it is used. */
  readonly trademark: string | null;
}

export interface IconCategory {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}
