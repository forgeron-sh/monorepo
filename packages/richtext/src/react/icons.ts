// The pixel icons of the editor's UI. The block catalog (core) names its icons as strings; this
// is the one place that turns a name into a drawing, so a catalog entry never imports an icon.

import {
  BoldIcon,
  CheckListIcon,
  CodeXmlIcon,
  CopyIcon,
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  Image03Icon,
  ItalicIcon,
  LeftToRightListBulletIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PlusIcon,
  QuoteIcon,
  StrikethroughIcon,
  Table01Icon,
  TrashIcon,
  TypeIcon,
  UnderlineIcon,
  type IconDefinition,
} from "@forgeron/icons";

const BLOCK_ICONS: Record<string, IconDefinition> = {
  type: TypeIcon,
  "heading-01": Heading01Icon,
  "heading-02": Heading02Icon,
  "heading-03": Heading03Icon,
  "left-to-right-list-bullet": LeftToRightListBulletIcon,
  "list-ordered": ListOrderedIcon,
  "check-list": CheckListIcon,
  quote: QuoteIcon,
  "code-xml": CodeXmlIcon,
  minus: MinusIcon,
  "table-01": Table01Icon,
  "image-03": Image03Icon,
};

/** The drawing for a catalog icon name; a plain list icon when the name is unknown. */
export const blockIcon = (name: string): IconDefinition => BLOCK_ICONS[name] ?? ListIcon;

export const UI_ICONS = {
  bold: BoldIcon,
  italic: ItalicIcon,
  underline: UnderlineIcon,
  strike: StrikethroughIcon,
  code: CodeXmlIcon,
  link: LinkIcon,
  plus: PlusIcon,
  copy: CopyIcon,
  trash: TrashIcon,
} as const;
