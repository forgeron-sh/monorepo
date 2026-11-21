// The shape of a gallery entry, shared by the registry and the entries files.

export interface PropRow {
  name: string;
  type: string;
  default?: string;
  description: string;
}

export interface Atom {
  slug: string;
  name: string;
  /** One line: what it is for. */
  summary: string;
  /** The names to import from `@forgeron/ui`. */
  imports: ReadonlyArray<string>;
  props: ReadonlyArray<PropRow>;
}
