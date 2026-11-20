import type { Atom } from "../types";

/** Gallery entry of the Feed primitive (D-157): the shared shape of the activity and log blocks. */
export const entries: ReadonlyArray<Atom> = [
  {
    slug: "feed",
    name: "Feed",
    summary: "An ordered list of events: a marker, who and what, when, an optional detail.",
    imports: [
      "Feed",
      "FeedItem",
      "FeedIndicator",
      "FeedContent",
      "FeedTitle",
      "FeedTime",
      "FeedDescription",
      "FeedGroup",
      "FeedGroupLabel",
    ],
    props: [
      {
        name: "Feed",
        type: "ol",
        description:
          "The list (an ol). Name it with aria-label. Activity, AuditLog, RunList, DeliveryLog and ApprovalAudit are built on it.",
      },
      {
        name: "connector",
        type: "boolean",
        default: "true",
        description:
          "The line between markers, with the marker and content columns. Off for dense rows laid out by you.",
      },
      {
        name: "FeedIndicator tone",
        type: `"neutral" | "success" | "warning" | "danger" | "accent" | "current"`,
        default: `"neutral"`,
        description:
          "The tone of the default marker, a Led. Children (an avatar, a glyph) replace it.",
      },
      {
        name: "FeedTime dateTime",
        type: "string",
        description: "Makes it a <time>; without it a plain span.",
      },
      {
        name: "FeedGroup, FeedGroupLabel",
        type: "div, h3",
        description: "A day or a phase: the label is a closed band over the entries that follow.",
      },
      { name: "className, ...rest", type: "—", description: "On every part." },
    ],
  },
];
