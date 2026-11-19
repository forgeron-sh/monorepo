// The site's Blueprint library, listed by the `virtual:blueprint-library` plugin of astro.config.ts.
declare module "virtual:blueprint-library" {
  export const library: ReadonlyArray<{
    name: string;
    /** Bytes of the file. */
    size: number;
    /** The file's text. */
    load: () => Promise<string>;
  }>;
}
