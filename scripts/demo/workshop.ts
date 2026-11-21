// "Q1 product workshop": the board a product team of eight leaves after a full day on FigJam, as a
// `forgeron/draw` document. Agenda, interview notes, support tickets imported as notes, the
// problem space clustered by affinity (pen circles, titles, dot votes), a second brainwriting
// round, "How might we" ideas, the top problems re-posted for a vote, a user journey with bound
// arrows and emotions, an architecture sketch, the retro, the roadmap, a parking lot and a few
// screenshots. Every text comes from the vocabularies below; the same seed gives the same board.

import type { Bounds, Point } from "../../packages/canvas/src/index";
import {
  arrowItem,
  frameItem,
  imageItem,
  penFromPoints,
  serializeBoard,
  shapeItem,
  stickyItem,
  textItem,
  type ArrowHead,
  type ArrowRoute,
  type DrawData,
  type DrawFill,
  type DrawItem,
  type DrawStroke,
  type ShapeKind,
  type StickyColor,
  type TextAlign,
} from "../../packages/draw/src/index";
import { Raster, seeded, type Rand } from "./util";

/* ---------------------------------------------------------------- people */

interface Person {
  name: string;
  initials: string;
  role: string;
  sticky: StickyColor;
  /** Their dot colour: eight people, eight dots (notes have five colours). */
  dot: string;
}

const PEOPLE: ReadonlyArray<Person> = [
  { name: "Camille Lefort", initials: "CL", role: "Product", sticky: "amber", dot: "#ffb020" },
  { name: "Hugo Marchand", initials: "HM", role: "Engineering", sticky: "green", dot: "#3ddc84" },
  {
    name: "Sarah Benali",
    initials: "SB",
    role: "Customer success",
    sticky: "rose",
    dot: "#ff6b81",
  },
  { name: "Yanis Kader", initials: "YK", role: "Sales", sticky: "ember", dot: "#ff4f1f" },
  { name: "Léa Dumas", initials: "LD", role: "Design", sticky: "grey", dot: "#c084fc" },
  { name: "Thomas Roux", initials: "TR", role: "Finance", sticky: "amber", dot: "#38bdf8" },
  { name: "Inès Garnier", initials: "IG", role: "Operations", sticky: "green", dot: "#f472b6" },
  { name: "Marc Perrin", initials: "MP", role: "CTO", sticky: "rose", dot: "#a3e635" },
];

/* ---------------------------------------------------------------- vocabularies */

interface Theme {
  title: string;
  subjects: string[];
  predicates: string[];
}

/** The problem space: what hurts, by theme. A note is a subject and a predicate. */
const THEMES: ReadonlyArray<Theme> = [
  {
    title: "Onboarding is slow",
    subjects: [
      "Setup wizard",
      "Odoo connection step",
      "Invite flow",
      "First template",
      "Workspace creation",
      "SSO setup",
    ],
    predicates: [
      "takes 2+ hours",
      "fails without a clear error",
      "asks for a key nobody has",
      "needs a dev on the call",
      "loses progress on refresh",
      "is English only",
    ],
  },
  {
    title: "Odoo sync errors",
    subjects: [
      "Invoice sync",
      "Partner sync",
      "Stock moves sync",
      "Multi-company sync",
      "Product variants sync",
      "Nightly full sync",
    ],
    predicates: [
      "times out on big batches",
      "duplicates records",
      "silently skips archived rows",
      "breaks after v17 upgrade",
      "hits the XML-RPC rate limit",
      "shows 'error 500' only",
    ],
  },
  {
    title: "Approvals get stuck",
    subjects: [
      "Purchase approvals",
      "Expense approvals",
      "Discount > 15%",
      "Credit limit overrides",
      "Vendor onboarding",
      "Refund approvals",
    ],
    predicates: [
      "wait days for one manager",
      "have no reminder",
      "can't be delegated on leave",
      "lose the comment thread",
      "need a second approver",
      "are approved by email, not logged",
    ],
  },
  {
    title: "Reporting is manual",
    subjects: [
      "Monthly AR aging",
      "Sales by region",
      "Cash forecast",
      "Board pack",
      "Margin per project",
      "DSO tracking",
    ],
    predicates: [
      "is rebuilt in Excel",
      "takes Thomas a full day",
      "never matches Odoo",
      "is a CSV export + VLOOKUP",
      "is late every month",
      "has no drill-down",
    ],
  },
  {
    title: "Permissions & access",
    subjects: [
      "Interns",
      "Accountants",
      "External auditors",
      "Shop managers",
      "Contractors",
      "Admins",
    ],
    predicates: [
      "see every company",
      "can't see their own team",
      "share one login",
      "keep access after leaving",
      "ask IT for every change",
      "need a role per tool",
    ],
  },
  {
    title: "Microsoft 365 friction",
    subjects: [
      "Teams approvals",
      "Outlook add-in",
      "SharePoint exports",
      "Graph consent",
      "Shared mailboxes",
      "Calendar sync",
    ],
    predicates: [
      "need a global admin",
      "break with MFA",
      "post to the wrong channel",
      "can't attach PDFs",
      "duplicate every event",
      "lose formatting",
    ],
  },
  {
    title: "Notification noise",
    subjects: [
      "Sync alerts",
      "Approval pings",
      "Daily digests",
      "Error emails",
      "Teams bot",
      "Mobile pushes",
    ],
    predicates: [
      "go to everyone",
      "arrive at 3 a.m.",
      "repeat 5× per failure",
      "can't be muted per tool",
      "have no link to the record",
      "are ignored by now",
    ],
  },
  {
    title: "Pricing & billing clarity",
    subjects: [
      "Usage-based pricing",
      "Fuel credits",
      "Invoice from us",
      "Seat count",
      "Annual plan",
      "Overage",
    ],
    predicates: [
      "is hard to predict",
      "surprises finance",
      "isn't visible in-app",
      "doesn't split per entity",
      "needs a PO number",
      "should cap automatically",
    ],
  },
  {
    title: "Field & mobile use",
    subjects: [
      "Drivers",
      "Technicians",
      "Shop staff",
      "Warehouse scans",
      "Signatures on site",
      "Photo uploads",
    ],
    predicates: [
      "work offline half the day",
      "use shared tablets",
      "need big buttons",
      "fail on 3G",
      "can't find the form",
      "retype into Odoo later",
    ],
  },
  {
    title: "Docs & support",
    subjects: [
      "Help center",
      "Error messages",
      "Changelog",
      "Templates docs",
      "Status page",
      "Chat support",
    ],
    predicates: [
      "doesn't cover Odoo 16",
      "is too technical",
      "isn't searchable",
      "answers after 2 days",
      "has no French version",
      "lacks screenshots",
    ],
  },
];

const COMPANIES = [
  { name: "Atelier Morel", what: "Furniture maker · 35 staff · Odoo 17" },
  { name: "Biocoop Rhône", what: "Food coop · 12 shops · Odoo 16" },
  { name: "Transports Vidal", what: "Logistics · 120 drivers · Odoo 17 + M365" },
  { name: "Clinique Saint-Roch", what: "Private clinic · finance team of 6" },
  { name: "Nordwind GmbH", what: "Wholesale · DE + AT entities · Odoo 17" },
  { name: "Studio Kapla", what: "Architects · 18 people · M365 only" },
];

const QUOTE_OPENERS = [
  "Honestly,",
  "Every month",
  "Our accountant says",
  "The real problem:",
  "We tried, but",
  "What we'd pay for:",
  "Today",
  "Last quarter",
];
const QUOTE_BODIES = [
  "we export to Excel and fix it by hand",
  "nobody knows who approved the discount",
  "the sync stops and we find out a week later",
  "invoices go out with the wrong VAT",
  "I chase managers on Teams for approvals",
  "reports take two days to build",
  "drivers type delivery notes twice",
  "we pay for seats nobody uses",
  "IT has to add every new hire by hand",
  "the error just says 'something went wrong'",
  "we need one view across both companies",
  "customers pay but Odoo still shows 'due'",
  "credit notes are done on paper",
  "we can't tell what an automation did",
];

const TICKET_TOPICS = [
  "Sync",
  "Invoices",
  "Approvals",
  "Login",
  "Teams",
  "Reports",
  "Exports",
  "Permissions",
  "Mobile",
  "Billing",
];
const TICKET_SYMPTOMS = [
  "job stuck at 'running'",
  "duplicate partner created",
  "PDF missing on email",
  "SSO loop after MFA",
  "wrong currency on total",
  "export cuts at 10k rows",
  "user can't see company B",
  "button does nothing on iPad",
  "VAT number rejected",
  "webhook fired twice",
  "date off by one day",
  "page blank after update",
  "approval mail never arrived",
  "rate limit from Odoo",
];

const IDEA_FEATURES = [
  "a sync health page",
  "one-click Odoo connect",
  "approval reminders in Teams",
  "delegation while on leave",
  "AR aging as a live view",
  "templates per industry",
  "roles per team, not per tool",
  "an offline mode for drivers",
  "a run history per record",
  "budget caps on Fuel",
  "a French help center",
  "a 'why did this fail' panel",
  "batching for big syncs",
  "a cash forecast template",
];
const IDEA_BENEFITS = [
  "so ops sees issues first",
  "to cut onboarding to 20 min",
  "so nothing waits > 24 h",
  "so finance trusts the numbers",
  "to stop the Excel exports",
  "so support gets fewer tickets",
  "to sell to multi-company",
  "so admins stop asking IT",
];

const HMW = [
  "HMW get a new customer to their first automation in one session?",
  "HMW make a sync failure obvious and fixable by ops?",
  "HMW keep approvals moving when someone is away?",
  "HMW give finance a month-end close without Excel?",
  "HMW let admins manage access without IT?",
  "HMW make Fuel spend predictable for finance?",
];

const RETRO = {
  "Went well": [
    "Customer quotes up front set the tone",
    "Everyone posted, not just PM",
    "Timeboxing kept us honest",
    "Hugo's architecture sketch",
    "Dot voting was fast",
    "Real tickets > opinions",
    "Lunch break at the right time",
    "Sales and eng agreed on top 3",
    "The journey map surfaced Finance pain",
    "Remote people could follow",
    "Great snacks",
    "Clear owner per action",
  ],
  "To improve": [
    "Too many notes per person",
    "Started 20 min late",
    "Pricing topic ran over",
    "We need data, not anecdotes",
    "Clusters were renamed 3 times",
    "Not enough customer voice from DE",
    "Should have invited support lead",
    "Board got messy after 3 p.m.",
    "Roadmap felt rushed",
    "Votes biased by seniority?",
    "Hard to read small notes on video",
    "Parking lot never revisited",
  ],
  Actions: [
    "Share the top 10 problems by Friday — CL",
    "Spike: sync health page — HM",
    "Interview 3 DE customers — SB",
    "Pricing calculator draft — TR",
    "Approval delegation design — LD",
    "Odoo v17 regression list — HM",
    "Kill notification spam: audit — IG",
    "Roadmap review with leadership — MP",
    "Help center FR: scope — SB",
    "Book next workshop for Q2 — CL",
  ],
} as const;

const ROADMAP_THEMES = [
  "Onboarding",
  "Odoo sync",
  "Approvals",
  "Reporting",
  "Access & admin",
  "Microsoft 365",
];
const ROADMAP_ITEMS: Record<string, string[]> = {
  Onboarding: [
    "Connect Odoo in 1 step",
    "Industry templates",
    "Guided first automation",
    "Import from Zapier",
    "In-app checklist",
    "French onboarding",
    "Sandbox workspace",
    "Usage tips email",
  ],
  "Odoo sync": [
    "Sync health page",
    "Batch + resume",
    "v17 field mapping",
    "Conflict resolution UI",
    "Multi-company scopes",
    "Webhook dedupe",
    "Archived records",
    "Rate-limit backoff",
  ],
  Approvals: [
    "Teams adaptive cards",
    "Reminders + escalation",
    "Delegation on leave",
    "Two-level approvals",
    "Approval audit log",
    "Mobile approve",
    "SLA per approval",
    "Approval analytics",
  ],
  Reporting: [
    "AR aging live view",
    "Cash forecast",
    "Board pack export",
    "DSO by country",
    "Scheduled reports",
    "Excel live link",
    "Margin per project",
    "Drill-down",
  ],
  "Access & admin": [
    "Teams & roles",
    "SCIM provisioning",
    "Offboarding sweep",
    "Auditor read-only",
    "Per-company scopes",
    "Access reviews",
    "Admin activity log",
    "Break-glass access",
  ],
  "Microsoft 365": [
    "Graph consent wizard",
    "Shared mailbox send",
    "SharePoint archive",
    "Outlook add-in v2",
    "Calendar booking",
    "Teams bot commands",
    "Planner tasks",
    "OneDrive PDFs",
  ],
};

/* ---------------------------------------------------------------- builder */

const STROKE = (
  color: string | null,
  width = 2,
  dash: DrawStroke["dash"] = "solid",
): DrawStroke => ({
  color,
  width,
  dash,
});
const SOLID = (color: string, opacity?: number): DrawFill => ({
  type: "solid",
  color,
  ...(opacity === undefined ? {} : { opacity }),
});
const NONE: DrawFill = { type: "none" };

class Board {
  readonly frames: DrawItem[] = [];
  readonly items: DrawItem[] = [];
  readonly byId = new Map<string, DrawItem>();
  private n = 0;

  constructor(readonly r: Rand) {}

  private put(prefix: string, made: { kind: string; bounds: Bounds; data: DrawData }): DrawItem {
    const b = made.bounds;
    const item: DrawItem = {
      id: `${prefix}${(++this.n).toString(36)}`,
      kind: made.kind,
      bounds: {
        x: Math.round(b.x),
        y: Math.round(b.y),
        w: Math.max(1, Math.round(b.w)),
        h: Math.max(1, Math.round(b.h)),
      },
      z: 0,
      data: made.data,
    };
    (made.kind === "frame" ? this.frames : this.items).push(item);
    this.byId.set(item.id, item);
    return item;
  }

  frame(name: string, b: Bounds) {
    return this.put("f", frameItem(b, name));
  }

  sticky(x: number, y: number, text: string, color: StickyColor, w = 160) {
    return this.put("s", stickyItem({ x, y }, text, color, w));
  }

  text(x: number, y: number, text: string, size = 20, color = "ink", align: TextAlign = "left") {
    return this.put("t", textItem({ x, y }, text, size, color, align));
  }

  shape(kind: ShapeKind, b: Bounds, fill: DrawFill, stroke: DrawStroke, text?: string) {
    return this.put("h", shapeItem(kind, b, { fill, stroke }, text));
  }

  vote(x: number, y: number, color: string) {
    return this.shape("ellipse", { x, y, w: 18, h: 18 }, SOLID(color), STROKE(null, 0));
  }

  arrow(
    from: DrawItem | Point,
    to: DrawItem | Point,
    opts: { head?: ArrowHead; route?: ArrowRoute; stroke?: DrawStroke } = {},
  ) {
    const point = (t: DrawItem | Point) =>
      "bounds" in t ? { x: t.bounds.x + t.bounds.w / 2, y: t.bounds.y + t.bounds.h / 2 } : t;
    const made = arrowItem(point(from), point(to), (id) => this.byId.get(id), {
      ...("id" in from ? { startBind: from.id } : {}),
      ...("id" in to ? { endBind: to.id } : {}),
      ...opts,
    });
    return this.put("a", made);
  }

  pen(points: Point[], color: string, weight = 1) {
    const g = penFromPoints(points, { color, weight });
    return g ? this.put("p", { kind: "pen", ...g }) : null;
  }

  image(b: Bounds, src: string, name: string) {
    return this.put("i", imageItem(b, src, name));
  }

  /* -- hand-drawn marks, wobbly like a trackpad */

  /** A loop around a box, not quite closed, overshooting a little. */
  circle(b: Bounds, color: string, weight = 2) {
    const r = this.r;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    const rx = b.w / 2 + 50;
    const ry = b.h / 2 + 50;
    const start = r.range(0, Math.PI * 2);
    const sweep = Math.PI * 2 + r.range(0.15, 0.5);
    const pts: Point[] = [];
    const steps = 64;
    let drift = 1;
    for (let i = 0; i <= steps; i++) {
      drift += r.range(-0.012, 0.012);
      const a = start + (sweep * i) / steps;
      pts.push({ x: cx + Math.cos(a) * rx * drift, y: cy + Math.sin(a) * ry * drift });
    }
    return this.pen(pts, color, weight);
  }

  underline(x: number, y: number, len: number, color: string) {
    const r = this.r;
    const pts = Array.from({ length: 16 }, (_, i) => ({
      x: x + (len * i) / 15,
      y: y + Math.sin(i / 2.5) * 3 + r.range(-2, 2) + i * r.range(-0.3, 0.3),
    }));
    return this.pen(pts, color, 2);
  }

  check(x: number, y: number, color: string) {
    return this.pen(
      [
        { x, y: y + 14 },
        { x: x + 8, y: y + 24 },
        { x: x + 28, y },
      ],
      color,
      2,
    );
  }

  star(cx: number, cy: number, size: number, color: string) {
    const pts: Point[] = [];
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
      pts.push({ x: cx + Math.cos(a) * size, y: cy + Math.sin(a) * size });
    }
    return this.pen(pts, color, 2);
  }

  /** A hand-drawn arrow: a bent line and a head. */
  scribbleArrow(from: Point, to: Point, color: string) {
    const r = this.r;
    const mid = {
      x: (from.x + to.x) / 2 + r.range(-40, 40),
      y: (from.y + to.y) / 2 + r.range(-40, 40),
    };
    const pts: Point[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      pts.push({
        x: (1 - t) ** 2 * from.x + 2 * (1 - t) * t * mid.x + t * t * to.x,
        y: (1 - t) ** 2 * from.y + 2 * (1 - t) * t * mid.y + t * t * to.y,
      });
    }
    const a = Math.atan2(to.y - mid.y, to.x - mid.x);
    pts.push({ x: to.x - Math.cos(a - 0.5) * 22, y: to.y - Math.sin(a - 0.5) * 22 }, to, {
      x: to.x - Math.cos(a + 0.5) * 22,
      y: to.y - Math.sin(a + 0.5) * 22,
    });
    return this.pen(pts, color, 2);
  }

  /** Handwriting seen from a step back: loops along a baseline, a word every few loops. */
  handwriting(x: number, y: number, len: number, color: string) {
    const r = this.r;
    const pts: Point[] = [];
    let at = x;
    while (at < x + len) {
      const loops = r.int(2, 5);
      for (let i = 0; i < loops * 6; i++) {
        const t = i / 6;
        pts.push({
          x: at + t * 9 + Math.cos(t * Math.PI * 2) * -3,
          y: y - Math.abs(Math.sin(t * Math.PI)) * r.range(8, 16),
        });
      }
      at += loops * 9 + r.range(10, 18);
      pts.push({ x: at - 6, y: y + 2 });
    }
    return this.pen(pts, color, 1);
  }

  /** Bottom first: frames, then everything else in the order it was drawn. */
  done(): DrawItem[] {
    const all = [...this.frames, ...this.items];
    all.forEach((item, i) => (item.z = i));
    // Each item belongs to the frame holding its centre (frames do not overlap here).
    for (const item of this.items) {
      const cx = item.bounds.x + item.bounds.w / 2;
      const cy = item.bounds.y + item.bounds.h / 2;
      const f = this.frames.find(
        (f) =>
          cx >= f.bounds.x &&
          cx <= f.bounds.x + f.bounds.w &&
          cy >= f.bounds.y &&
          cy <= f.bounds.y + f.bounds.h,
      );
      if (f && item.data.type !== "frame") item.data = { ...item.data, frame: f.id };
    }
    return all;
  }
}

/* ---------------------------------------------------------------- helpers */

/** Every subject-predicate pair of a theme, shuffled, as notes signed by someone. */
function themeNotes(r: Rand, t: Theme, count: number): Array<{ text: string; who: Person }> {
  const pairs = t.subjects.flatMap((s) => t.predicates.map((p) => `${s} ${p}`));
  return r
    .shuffle(pairs)
    .slice(0, count)
    .map((text) => {
      const who = r.pick(PEOPLE);
      return { text: `${text} — ${who.initials}`, who };
    });
}

/** Places notes in a rough grid: a facilitator moved them, not a layout engine. */
function messyGrid(
  b: Board,
  x: number,
  y: number,
  cols: number,
  notes: Array<{ text: string; color: StickyColor }>,
  { gap = 14, jitter = 14 }: { gap?: number; jitter?: number } = {},
): DrawItem[] {
  const r = b.r;
  const rowH: number[] = [];
  const out: DrawItem[] = [];
  notes.forEach((n, i) => {
    const c = i % cols;
    const row = Math.floor(i / cols);
    const top = y + rowH.slice(0, row).reduce((s, h) => s + h + gap, 0);
    const item = b.sticky(
      x + c * (160 + gap) + r.range(-jitter, jitter),
      top + r.range(-jitter, jitter),
      n.text,
      n.color,
    );
    rowH[row] = Math.max(rowH[row] ?? 0, item.bounds.h);
    out.push(item);
  });
  return out;
}

/** A sunflower blob of notes: a cluster that grew as people walked up to it. */
function blob(
  b: Board,
  cx: number,
  cy: number,
  notes: Array<{ text: string; color: StickyColor }>,
  spacing = 92,
): DrawItem[] {
  const r = b.r;
  return notes.map((n, i) => {
    const rad = spacing * Math.sqrt(i + 0.5);
    const a = i * 2.39996 + r.range(-0.08, 0.08);
    return b.sticky(
      cx + Math.cos(a) * rad * 1.15 - 80 + r.range(-10, 10),
      cy + Math.sin(a) * rad - 80 + r.range(-10, 10),
      n.text,
      n.color,
    );
  });
}

const boundsOf = (items: ReadonlyArray<DrawItem>): Bounds => {
  const x0 = Math.min(...items.map((i) => i.bounds.x));
  const y0 = Math.min(...items.map((i) => i.bounds.y));
  const x1 = Math.max(...items.map((i) => i.bounds.x + i.bounds.w));
  const y1 = Math.max(...items.map((i) => i.bounds.y + i.bounds.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

/** Dots on notes: each person spends `budget` votes, favourites get more. */
function dotVote(b: Board, notes: ReadonlyArray<DrawItem>, budget: number): Map<string, number> {
  const r = b.r;
  const tally = new Map<string, number>();
  // A few notes everybody likes; the rest spread.
  const hot = r.shuffle(notes).slice(0, Math.max(3, Math.round(notes.length / 8)));
  for (const p of PEOPLE) {
    for (let v = 0; v < budget; v++) {
      const note = r.chance(0.6) ? r.pick(hot) : r.pick(notes);
      const k = tally.get(note.id) ?? 0;
      tally.set(note.id, k + 1);
      const nb = note.bounds;
      b.vote(
        nb.x + 10 + (k % 6) * 22 + r.range(-2, 2),
        nb.y + nb.h - 30 - Math.floor(k / 6) * 22 + r.range(-2, 2),
        p.dot,
      );
    }
  }
  return tally;
}

/** A tiny screenshot: a window, a sidebar, rows, a red or green badge. */
function screenshot(kind: "error" | "inbox" | "sheet" | "photo", r: Rand): string {
  const w = 160;
  const h = 100;
  if (kind === "photo") {
    // A whiteboard photo: off-white, notes as coloured squares, a marker line.
    const img = new Raster(w, h, 0xe8e4dc);
    const colors = [0xffd166, 0x9be7a4, 0xff9aa2, 0xffb38a];
    for (let i = 0; i < 26; i++)
      img.rect(r.int(4, w - 18), r.int(4, h - 18), 13, 13, r.pick(colors));
    for (let i = 0; i < 120; i++)
      img.rect(10 + i, 50 + Math.round(Math.sin(i / 9) * 12), 1, 2, 0x2b3a67);
    return img.dataUrl();
  }
  const img = new Raster(w, h, 0x111111);
  img.rect(0, 0, w, 10, 0x1e1e1e).rect(4, 3, 4, 4, 0xff5f57).rect(10, 3, 4, 4, 0xfebc2e);
  img.rect(0, 10, 30, h - 10, 0x161616);
  for (let i = 0; i < 6; i++) img.rect(5, 16 + i * 10, 20, 4, 0x3a3a3a);
  if (kind === "sheet") {
    for (let j = 0; j < 9; j++)
      for (let i = 0; i < 5; i++)
        img.rect(
          36 + i * 24,
          16 + j * 9,
          22,
          7,
          j === 0 ? 0x2e7d32 : (i + j) % 2 ? 0x2a2a2a : 0x222222,
        );
    img.rect(36 + 4 * 24, 16 + 6 * 9, 22, 7, 0xb3261e);
    return img.dataUrl();
  }
  for (let j = 0; j < 7; j++) {
    img.rect(36, 16 + j * 11, 90, 6, 0x2e2e2e);
    img.rect(130, 16 + j * 11, 22, 6, kind === "inbox" ? (j < 4 ? 0xffb020 : 0x3ddc84) : 0x3a3a3a);
  }
  if (kind === "error") {
    img.rect(50, 30, 90, 46, 0x1b1b1b).rect(50, 30, 90, 6, 0xff4f1f);
    img.rect(56, 42, 70, 4, 0xededed).rect(56, 50, 54, 4, 0x8f8f8f).rect(104, 64, 30, 8, 0xff4f1f);
  }
  return img.dataUrl();
}

/* ---------------------------------------------------------------- the board */

export function q1Workshop(seed = 2027): { items: DrawItem[]; json: string } {
  const r = seeded(seed);
  const b = new Board(r);

  /* -- Agenda */
  const agenda = { x: 0, y: 0, w: 900, h: 1150 };
  b.frame("Agenda — Q1 product workshop", agenda);
  b.text(48, 56, "Q1 product workshop", 44);
  b.text(48, 128, "Lyon office + remote · 8 people · 09:00–17:30", 18, "muted");
  const slots = [
    ["09:00", "Check-in, goals of the day"],
    ["09:20", "Customer interviews: playback"],
    ["10:00", "Support tickets: what we hear"],
    ["10:30", "Problem space: silent posting"],
    ["11:15", "Affinity clustering"],
    ["11:45", "Dot voting (12 dots each)"],
    ["12:30", "Lunch"],
    ["13:30", "User journey: order to cash"],
    ["14:15", "How might we… + ideas"],
    ["15:15", "Architecture: what it takes"],
    ["16:00", "Roadmap: quarters × themes"],
    ["17:00", "Retro + actions"],
  ] as const;
  slots.forEach(([time, what], i) => {
    const y = 200 + i * 74;
    b.shape("rectangle", { x: 48, y: y + 4, w: 24, h: 24 }, NONE, STROKE("muted", 2));
    b.text(92, y, time, 20, "accent");
    b.text(180, y, what, 20);
    if (i < 11) b.check(50, y, i % 3 ? "success" : "ink");
  });
  b.text(48, 1090, "Facilitator: Camille · Timekeeper: Inès", 16, "muted");

  /* -- Parking lot */
  const parking = { x: 0, y: 1350, w: 900, h: 1500 };
  b.frame("Parking lot", parking);
  b.text(48, 1400, "Parking lot — not today", 32);
  const parked = [
    "Rename 'Fuel'?",
    "SOC 2 timeline",
    "Odoo.sh vs on-prem support",
    "Partner program",
    "Dark mode for console",
    "API rate limits for big tenants",
    "Do we support Odoo 15?",
    "Data residency (CH)",
    "Pricing page A/B test",
    "Who owns templates?",
    "Slack connector (some ask)",
    "Hiring: second designer",
    "Webinar with Odoo partner",
    "German UI",
    "Mobile app or PWA?",
    "Audit logs export",
    "Migration from Zapier",
    "SAML for small plans?",
    "Event on Odoo Experience",
    "Public roadmap?",
    "Customer advisory board",
    "Status page subscribers",
    "Usage alerts by SMS",
    "AI step: who pays?",
  ];
  messyGrid(
    b,
    48,
    1480,
    5,
    parked.map((text, i) => ({ text, color: PEOPLE[i % PEOPLE.length]!.sticky })),
    { jitter: 10 },
  );

  /* -- Evidence: screenshots */
  const evidence = { x: -1300, y: 300, w: 1100, h: 1400 };
  b.frame("Evidence — screenshots", evidence);
  b.text(-1250, 350, "Screenshots from the interviews", 28);
  const shots = [
    ["error", "Sync error dialog (Transports Vidal)"],
    ["inbox", "Approval inbox: 41 pending (Nordwind)"],
    ["sheet", "AR aging rebuilt in Excel (Clinique)"],
    ["photo", "Their whiteboard, Biocoop HQ"],
  ] as const;
  shots.forEach(([kind, caption], i) => {
    const x = -1250 + (i % 2) * 520;
    const y = 450 + Math.floor(i / 2) * 560 + r.range(-20, 20);
    b.image({ x, y, w: 480, h: 300 }, screenshot(kind, r), caption);
    b.text(x, y + 320, caption, 16, "muted");
    if (kind === "error") b.circle({ x: x + 150, y: y + 90, w: 280, h: 140 }, "danger");
    if (kind === "sheet")
      b.scribbleArrow({ x: x + 460, y: y + 420 }, { x: x + 420, y: y + 230 }, "accent");
  });

  /* -- Interview notes */
  const interviews = { x: 1300, y: -2700, w: 5200, h: 2150 };
  b.frame("Interview notes — 6 customers", interviews);
  b.text(1350, -2640, "Customer interviews · playback", 36);
  COMPANIES.forEach((c, i) => {
    const x = 1350 + i * 845 + r.range(-15, 15);
    const head = b.shape(
      "rectangle",
      { x, y: -2540, w: 810, h: 110 },
      SOLID("raised"),
      STROKE("line", 2),
      `${c.name}\n${c.what}`,
    );
    const quotes = r
      .shuffle(QUOTE_OPENERS.flatMap((o) => QUOTE_BODIES.map((q) => `"${o} ${q}"`)))
      .slice(0, 25);
    const notes = messyGrid(
      b,
      x,
      -2400,
      5,
      quotes.map((text, k) => ({ text, color: k % 4 === 0 ? "grey" : "amber" })),
      { gap: 2, jitter: 4 },
    );
    if (i % 2 === 0) b.star(x + 790, -2560, 22, "accent");
    b.underline(x + 10, -2420, 300, "accent");
    void head;
    void notes;
  });

  /* -- Support tickets, imported as notes */
  const tickets = { x: 6900, y: -2700, w: 3400, h: 2900 };
  b.frame("Support tickets — last 90 days (import)", tickets);
  b.text(6950, -2640, "320 tickets from the helpdesk, tagged", 32);
  b.text(6950, -2590, "Imported with the CSV plugin · one note per ticket", 16, "muted");
  const tk = Array.from({ length: 320 }, (_, i) => {
    const topic = r.pick(TICKET_TOPICS);
    return {
      text: `HD-${4100 + i * 3 + r.int(0, 2)} · ${topic}\n${r.pick(TICKET_SYMPTOMS)}`,
      color: (topic === "Sync" ? "rose" : topic === "Billing" ? "ember" : "grey") as StickyColor,
    };
  });
  const tkNotes = messyGrid(b, 6950, -2500, 20, tk, { gap: 4, jitter: 0 });
  for (const n of r.shuffle(tkNotes).slice(0, 14))
    b.check(n.bounds.x + 120, n.bounds.y + 6, "success");

  /* -- Problem space */
  const ps = { x: 1200, y: -300, w: 5400, h: 4250 };
  b.frame("Problem space — what hurts today", ps);
  b.text(1250, -240, "Problem space", 48);
  b.text(1250, -170, "Silent posting 10:30–11:15, then clustered. 12 dots each.", 18, "muted");
  const centres: Array<[number, number, "blob" | "grid"]> = [
    [1900, 640, "blob"],
    [3150, 460, "grid"],
    [4400, 640, "blob"],
    [5800, 520, "grid"],
    [1800, 1850, "grid"],
    [3150, 1950, "blob"],
    [4450, 1900, "grid"],
    [5750, 2000, "blob"],
    [2400, 3200, "grid"],
    [4500, 3260, "blob"],
  ];
  const problemNotes: DrawItem[] = [];
  const clusterTitles: DrawItem[] = [];
  THEMES.forEach((theme, i) => {
    const [cx, cy, shape] = centres[i]!;
    const notes = themeNotes(r, theme, 30).map((n) => ({ text: n.text, color: n.who.sticky }));
    const placed =
      shape === "blob"
        ? blob(b, cx, cy, notes, 98)
        : messyGrid(b, cx - 520, cy - 430, 6, notes, { gap: 10, jitter: 18 });
    problemNotes.push(...placed);
    const box = boundsOf(placed);
    b.circle(box, i % 3 === 0 ? "accent" : i % 3 === 1 ? "warning" : "ink", 2);
    const title = b.text(box.x + 20, box.y - 110, theme.title, 36, "ink");
    clusterTitles.push(title);
    b.underline(box.x + 20, box.y - 52, Math.min(560, theme.title.length * 20), "accent");
  });
  const psVotes = dotVote(b, problemNotes, 12);
  // Links the team drew between clusters.
  const link = (a: number, c: number, label: string) => {
    const arrow = b.arrow(clusterTitles[a]!, clusterTitles[c]!, {
      stroke: STROKE("muted", 2, "dashed"),
    });
    b.text(
      arrow.bounds.x + arrow.bounds.w / 2 - 60,
      arrow.bounds.y + arrow.bounds.h / 2 - 30,
      label,
      16,
      "muted",
    );
  };
  link(1, 3, "causes");
  link(2, 6, "pings!");
  link(0, 9, "same root?");
  link(4, 5, "consent = admin");
  link(1, 7, "support cost");
  link(8, 6, "offline → missed");
  for (let i = 0; i < 8; i++) {
    const n = r.pick(problemNotes);
    b.star(n.bounds.x + 150, n.bounds.y + 6, 14, "warning");
  }

  /* -- Brainwriting, round 2 */
  const bw = { x: 7000, y: 400, w: 2950, h: 3200 };
  b.frame("Brainwriting — round 2", bw);
  b.text(7050, 460, "Brainwriting: 6 minutes × 5 rounds, pass the column", 30);
  PEOPLE.forEach((p, i) => {
    const x = 7050 + i * 360;
    b.text(x, 540, `${p.name.split(" ")[0]} · ${p.role}`, 18, "muted");
    const ideas = r
      .shuffle(IDEA_FEATURES.flatMap((f) => IDEA_BENEFITS.map((g) => `What if ${f} ${g}?`)))
      .slice(0, 36);
    messyGrid(
      b,
      x,
      590,
      2,
      ideas.map((text) => ({ text, color: p.sticky })),
      { gap: 4, jitter: 6 },
    );
  });

  /* -- How might we */
  const hmw = { x: 10400, y: -2700, w: 3700, h: 2900 };
  b.frame("How might we… — ideas", hmw);
  const hmwNotes: DrawItem[] = [];
  HMW.forEach((q, i) => {
    const x = 10450 + (i % 3) * 1220;
    const y = -2640 + Math.floor(i / 3) * 1440;
    b.shape(
      "rectangle",
      { x, y, w: 1100, h: 120 },
      { type: "pattern", pattern: "dots-25", color: "accent" },
      STROKE("accent", 2),
      q,
    );
    const ideas = r
      .shuffle(
        IDEA_FEATURES.flatMap((f) =>
          IDEA_BENEFITS.map((g) => `${f[0]!.toUpperCase()}${f.slice(1)} ${g}`),
        ),
      )
      .slice(0, 30);
    const placed = messyGrid(
      b,
      x,
      y + 150,
      6,
      ideas.map((text) => ({ text, color: r.pick(PEOPLE).sticky })),
      { gap: 8, jitter: 12 },
    );
    hmwNotes.push(...placed);
  });
  dotVote(b, hmwNotes, 12);

  /* -- Dot voting: the top problems, re-posted */
  const dv = { x: 10400, y: 450, w: 2700, h: 2150 };
  b.frame("Dot voting — top problems", dv);
  b.text(10450, 510, "Top problems after the first vote", 32);
  b.text(10450, 570, "Re-posted from the problem space · second vote, 12 dots each", 16, "muted");
  const ranked = [...problemNotes]
    .sort((a, c) => (psVotes.get(c.id) ?? 0) - (psVotes.get(a.id) ?? 0))
    .slice(0, 48);
  const reposted = messyGrid(
    b,
    10450,
    640,
    12,
    ranked.map((n, i) => ({
      text: `#${i + 1} ${(n.data as { text: string }).text}`,
      color: (n.data as { color: StickyColor }).color,
    })),
    { gap: 22, jitter: 6 },
  );
  dotVote(b, reposted, 12);
  // Legend: who is which dot.
  PEOPLE.forEach((p, i) => {
    b.vote(12700, 520 + i * 30, p.dot);
    b.text(12730, 514 + i * 30, p.name, 16, "muted");
  });

  /* -- Retro */
  const retro = { x: 10400, y: 2900, w: 3700, h: 1850 };
  b.frame("Retro", retro);
  (Object.keys(RETRO) as Array<keyof typeof RETRO>).forEach((col, i) => {
    const x = 10450 + i * 1220;
    b.shape(
      "rectangle",
      { x, y: 2960, w: 1150, h: 70 },
      SOLID(i === 0 ? "success-subtle" : i === 1 ? "danger-subtle" : "warning-subtle"),
      STROKE(i === 0 ? "success" : i === 1 ? "danger" : "warning", 2),
      col,
    );
    const lines = RETRO[col];
    if (col === "Actions") {
      lines.forEach((line, k) => {
        const y = 3070 + k * 60;
        b.shape("rectangle", { x, y: y + 2, w: 22, h: 22 }, NONE, STROKE("muted", 2));
        b.text(x + 40, y, line, 18);
      });
      b.handwriting(x + 40, 3720, 600, "muted");
      b.handwriting(x + 40, 3770, 420, "muted");
      return;
    }
    // Several people posted the same thing: duplicates stacked, as on a real retro.
    const notes = Array.from({ length: 36 }, (_, k) => {
      const who = r.pick(PEOPLE);
      return { text: `${lines[k % lines.length]} — ${who.initials}`, color: who.sticky };
    });
    const placed = messyGrid(b, x, 3060, 6, notes, { gap: 6, jitter: 16 });
    dotVote(b, placed.slice(0, 12), 2);
  });

  /* -- User journey: order to cash, for a customer like Transports Vidal */
  const jx = -300;
  const jy = 4300;
  b.frame("User journey — from trial to month-end close", { x: jx, y: jy, w: 5600, h: 2400 });
  b.text(jx + 50, jy + 50, "User journey: Transports Vidal, first 60 days", 36);
  const stages = [
    "Discover",
    "Trial & connect Odoo",
    "First automation",
    "Approvals live",
    "First month-end",
    "Expand to 2nd company",
    "Renew",
  ];
  const lanes = ["Customer admin", "Ops team", "Finance", "Forgeron"];
  const laneY = (i: number) => jy + 220 + i * 440;
  const colX = (i: number) => jx + 260 + i * 760;
  stages.forEach((s, i) =>
    b.shape(
      "rectangle",
      { x: colX(i), y: jy + 130, w: 720, h: 60 },
      SOLID("raised"),
      STROKE("line", 1),
      s,
    ),
  );
  lanes.forEach((l, i) => {
    b.shape(
      "rectangle",
      { x: jx + 40, y: laneY(i), w: 5500, h: 420 },
      i % 2 ? NONE : { type: "pattern", pattern: "dots-25", color: "line" },
      STROKE("line", 1, "dashed"),
    );
    b.text(jx + 60, laneY(i) + 20, l, 20, "muted");
  });
  const steps: Record<string, string[][]> = {
    "Customer admin": [
      ["Reads a LinkedIn post", "Books a demo"],
      ["Creates workspace", "Pastes Odoo URL + key"],
      ["Picks 'Invoice reminders' template"],
      ["Adds managers as approvers"],
      ["Checks the run history"],
      ["Adds company B", "Sets per-company access"],
      ["Reviews usage", "Signs annual plan"],
    ],
    "Ops team": [
      ["—"],
      ["Waits for IT key"],
      ["Tests on 10 orders", "Fixes a field mapping"],
      ["Approves from Teams"],
      ["Handles 3 sync errors"],
      ["Copies flows to company B"],
      ["Asks for offline mode"],
    ],
    Finance: [
      ["—"],
      ["Worried about VAT"],
      ["—"],
      ["Discount approvals in Teams"],
      ["AR aging still in Excel", "Close takes 4 days"],
      ["Needs consolidated report"],
      ["Questions Fuel overage"],
    ],
    Forgeron: [
      ["Demo + trial"],
      ["Onboarding call", "Odoo connector"],
      ["Template library"],
      ["Teams adaptive cards"],
      ["Sync alerts", "Run history"],
      ["Multi-company scopes"],
      ["Usage report", "Renewal call"],
    ],
  };
  const stepItems: DrawItem[][] = lanes.map(() => []);
  lanes.forEach((lane, li) => {
    stages.forEach((_, si) => {
      const cards = steps[lane]![si]!;
      cards.forEach((label, k) => {
        if (label === "—") return;
        const x = colX(si) + 20 + k * 360 + r.range(-10, 10);
        const y = laneY(li) + 90 + (k % 2) * 40 + r.range(-10, 10);
        const card = b.shape(
          "rectangle",
          { x, y, w: 320, h: 100 },
          SOLID(li === 3 ? "warning-subtle" : "raised"),
          STROKE(li === 3 ? "warning" : "ink", 2),
          label,
        );
        stepItems[li]!.push(card);
      });
    });
  });
  // Arrows between consecutive steps of a lane, and a few across lanes.
  stepItems.forEach((list) => {
    for (let i = 1; i < list.length; i++) b.arrow(list[i - 1]!, list[i]!, { route: "elbow" });
  });
  const cross = [
    [0, 1, 1, 0],
    [0, 3, 3, 0],
    [1, 2, 0, 3],
    [3, 2, 1, 2],
    [2, 4, 3, 5],
    [1, 4, 3, 4],
    [0, 5, 3, 7],
    [2, 5, 0, 8],
    [0, 8, 3, 9],
  ];
  for (const [la, ia, lb, ib] of cross) {
    const a = stepItems[la!]![ia!];
    const c = stepItems[lb!]![ib!];
    if (a && c) b.arrow(a, c, { stroke: STROKE("accent", 2, "dashed") });
  }
  // Emotions: a diamond per stage, high or low.
  const mood = [0.7, 0.25, 0.6, 0.75, 0.1, 0.45, 0.65];
  const moodItems = mood.map((m, i) => {
    const d = b.shape(
      "diamond",
      { x: colX(i) + 300, y: jy + 2200 - m * 200, w: 110, h: 90 },
      SOLID(m > 0.55 ? "success-subtle" : m < 0.3 ? "danger-subtle" : "warning-subtle"),
      STROKE(m > 0.55 ? "success" : m < 0.3 ? "danger" : "warning", 2),
      m > 0.55 ? ":)" : m < 0.3 ? ":(" : ":|",
    );
    return d;
  });
  for (let i = 1; i < moodItems.length; i++)
    b.arrow(moodItems[i - 1]!, moodItems[i]!, { head: "none", stroke: STROKE("muted", 2) });
  // Pain points posted on the journey.
  const pains = [
    "IT key took 6 days",
    "Field mapping by trial and error",
    "Approvers on leave",
    "3 sync errors, no idea why",
    "Excel again for AR",
    "Access per company is fiddly",
    "Overage surprised Thomas",
    "Close still takes 4 days",
  ];
  pains.forEach((p, i) => {
    const si = [1, 2, 3, 4, 4, 5, 6, 4][i]!;
    b.sticky(colX(si) + 420 + r.range(-30, 30), laneY(2) + 260 + r.range(-40, 40), p, "rose");
  });

  /* -- Architecture */
  const ax = 5700;
  const ay = 4100;
  b.frame("Architecture — what it takes", { x: ax, y: ay, w: 3700, h: 2600 });
  b.text(ax + 50, ay + 50, "Architecture sketch (Hugo)", 36);
  const zone = (x: number, y: number, w: number, h: number, label: string) => {
    b.shape(
      "rectangle",
      { x: ax + x, y: ay + y, w, h },
      { type: "pattern", pattern: "dots-25", color: "line" },
      STROKE("muted", 1, "dashed"),
    );
    b.text(ax + x + 16, ay + y + 12, label, 16, "muted");
  };
  zone(40, 160, 760, 2380, "Users");
  zone(880, 160, 1700, 2380, "Cloudflare (our account or theirs)");
  zone(2660, 160, 1000, 2380, "Upstreams");
  const box = (
    x: number,
    y: number,
    label: string,
    kind: ShapeKind = "rectangle",
    accent = false,
  ) =>
    b.shape(
      kind,
      {
        x: ax + x,
        y: ay + y,
        w: kind === "ellipse" ? 260 : 300,
        h: kind === "ellipse" ? 130 : 110,
      },
      accent ? SOLID("warning-subtle") : SOLID("raised"),
      STROKE(accent ? "accent" : "ink", 2),
      label,
    );
  const admin = box(120, 300, "Customer admin\n(browser)");
  const ops = box(120, 900, "Ops user\n(Teams / mobile)");
  const dev = box(120, 1500, "Developer\n(CLI + MCP)");
  const gateway = box(1100, 900, "Gateway\n(Worker)", "rectangle", true);
  const consoleApp = box(1100, 300, "Console\n(SPA)");
  const registry = box(1100, 1600, "Registry\n(tools, versions)");
  const runtime = box(1800, 900, "Tool runtime\n(Workers for Platforms)", "rectangle", true);
  const connectors = box(1800, 1500, "Connectors\n(Odoo, M365)");
  const queue = box(1800, 300, "Queues\n(retries, DLQ)");
  const d1 = box(1150, 2150, "D1\n(per tool)", "ellipse");
  const r2 = box(1850, 2150, "R2\n(files, PDFs)", "ellipse");
  const kv = box(2250, 2150, "KV\n(sessions)", "ellipse");
  const odoo = box(2900, 600, "Odoo 16/17\n(XML-RPC, JSON-RPC)");
  const graph = box(2900, 1200, "Microsoft 365\n(Graph API)");
  const stripe = box(2900, 1800, "Stripe / bank feed\n(webhooks)");
  const wire = (a: DrawItem, c: DrawItem, label: string, dashed = false) => {
    const arrow = b.arrow(a, c, { stroke: STROKE("ink", 2, dashed ? "dashed" : "solid") });
    const ab = arrow.bounds;
    b.text(ab.x + ab.w / 2 + 8, ab.y + ab.h / 2 - 26, label, 14, "muted");
  };
  wire(admin, consoleApp, "HTTPS");
  wire(consoleApp, gateway, "API · session");
  wire(ops, gateway, "Teams card · OAuth");
  wire(dev, registry, "forgeron deploy");
  wire(dev, gateway, "MCP");
  wire(gateway, runtime, "dispatch");
  wire(gateway, queue, "enqueue");
  wire(queue, runtime, "consume");
  wire(runtime, connectors, "bindings");
  wire(registry, runtime, "versions", true);
  wire(runtime, d1, "SQL");
  wire(runtime, r2, "put/get");
  wire(gateway, kv, "sessions", true);
  wire(gateway, d1, "audit", true);
  wire(connectors, odoo, "JSON-RPC");
  wire(connectors, graph, "Graph");
  wire(stripe, gateway, "webhooks");
  wire(odoo, gateway, "webhooks", true);
  b.sticky(ax + 2900, ay + 300, "Rate limit on Odoo.sh! batch + backoff", "rose");
  b.sticky(ax + 3120, ay + 2050, "Who holds the M365 consent?", "amber");
  b.sticky(ax + 2250, ay + 1300, "One DLQ per tool?", "green");
  b.sticky(ax + 400, ay + 2100, "SSO via Entra ID first", "grey");
  b.circle({ x: ax + 1800, y: ay + 900, w: 300, h: 110 }, "accent");
  b.scribbleArrow({ x: ax + 2600, y: ay + 420 }, { x: ax + 2950, y: ay + 560 }, "danger");
  b.handwriting(ax + 920, ay + 2440, 700, "muted");

  /* -- Roadmap */
  const rx = 9700;
  const ry = 5000;
  b.frame("Roadmap — 2027 by quarter", { x: rx, y: ry, w: 4500, h: 2600 });
  b.text(rx + 50, ry + 40, "Roadmap 2027 (draft, for leadership review)", 36);
  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const cellW = 980;
  const cellH = 340;
  quarters.forEach((q, i) =>
    b.shape(
      "rectangle",
      { x: rx + 300 + i * cellW, y: ry + 120, w: cellW - 20, h: 60 },
      SOLID(i === 0 ? "warning-subtle" : "raised"),
      STROKE(i === 0 ? "warning" : "line", 2),
      q,
    ),
  );
  const cards = new Map<string, DrawItem>();
  ROADMAP_THEMES.forEach((theme, ti) => {
    const y = ry + 200 + ti * (cellH + 20);
    b.text(rx + 40, y + 20, theme, 20);
    const items = ROADMAP_ITEMS[theme]!;
    let next = 0;
    quarters.forEach((_, qi) => {
      b.shape(
        "rectangle",
        { x: rx + 300 + qi * cellW, y, w: cellW - 20, h: cellH },
        NONE,
        STROKE("line", 1),
      );
      const n = qi === 0 ? 3 : qi === 3 ? 1 : 2;
      for (let k = 0; k < n; k++) {
        const label = items[next++ % items.length]!;
        const card = b.shape(
          "rectangle",
          {
            x: rx + 320 + qi * cellW + k * 310 + r.range(-6, 6),
            y: y + 30 + (k % 2) * 120 + r.range(-6, 6),
            w: 290,
            h: 90,
          },
          SOLID(qi === 0 ? "warning-subtle" : "raised"),
          STROKE(qi === 0 ? "accent" : "ink", 2),
          label,
        );
        cards.set(label, card);
      }
    });
  });
  const dep = (a: string, c: string) => {
    const from = cards.get(a);
    const to = cards.get(c);
    if (from && to) b.arrow(from, to, { route: "elbow", stroke: STROKE("accent", 2, "dashed") });
  };
  dep("Sync health page", "Conflict resolution UI");
  dep("Connect Odoo in 1 step", "Guided first automation");
  dep("Teams adaptive cards", "Two-level approvals");
  dep("Teams & roles", "Per-company scopes");
  dep("Batch + resume", "Multi-company scopes");
  dep("AR aging live view", "Scheduled reports");
  dep("Graph consent wizard", "SharePoint archive");
  dep("Reminders + escalation", "Approval audit log");
  quarters.forEach((_, i) => {
    b.shape(
      "diamond",
      { x: rx + 300 + i * cellW + cellW - 90, y: ry + 2380, w: 60, h: 60 },
      SOLID("accent"),
      STROKE(null, 0),
    );
    b.text(
      rx + 300 + i * cellW + 20,
      ry + 2390,
      ["Beta: sync health", "GA approvals", "Reporting launch", "Multi-company GA"][i]!,
      18,
      "muted",
    );
  });
  b.pen(
    [
      { x: rx + 300 + 650, y: ry + 110 },
      { x: rx + 300 + 655, y: ry + 2360 },
    ],
    "danger",
    1,
  );
  b.text(rx + 300 + 670, ry + 2320, "today", 16, "danger");
  for (const label of ["Sync health page", "Teams adaptive cards", "AR aging live view"]) {
    const c = cards.get(label);
    if (c) b.star(c.bounds.x + c.bounds.w - 10, c.bounds.y + 6, 16, "warning");
  }

  /* -- Icebreaker: draw your weekend */
  const ice = { x: -1300, y: -1500, w: 1100, h: 1600 };
  b.frame("Icebreaker — draw your weekend", ice);
  b.text(-1250, -1450, "Icebreaker: draw your weekend in 2 minutes", 24);
  PEOPLE.forEach((p, i) => {
    const x = -1250 + (i % 2) * 520;
    const y = -1370 + Math.floor(i / 2) * 360;
    b.shape("rectangle", { x, y, w: 480, h: 320 }, NONE, STROKE("line", 1));
    b.text(x + 12, y + 8, p.name, 16, "muted");
    const cx = x + 240;
    const cy = y + 180;
    // A sun, a hill, a figure, or a bike: a few strokes each, never the same.
    for (let k = 0; k < 11; k++) {
      const kind = (k + i) % 4;
      const ox = cx + r.range(-170, 170);
      const oy = cy + r.range(-90, 100);
      if (kind === 0) b.circle({ x: ox - 20, y: oy - 20, w: 0, h: 0 }, p.dot, 1);
      else if (kind === 1) b.underline(ox - 80, oy, 160, p.dot);
      else if (kind === 2) b.star(ox, oy, 18, p.dot);
      else b.scribbleArrow({ x: ox - 60, y: oy + 30 }, { x: ox + 40, y: oy - 20 }, p.dot);
    }
  });

  /* -- Metrics wall: charts drawn with boxes, numbers from the BI export */
  const mx = -3900;
  const my = -200;
  b.frame("Metrics wall — Q4 numbers", { x: mx, y: my, w: 2400, h: 2560 });
  b.text(mx + 50, my + 40, "Q4 numbers (from the BI export, 2026-12-31)", 30);
  const charts: Array<{ title: string; values: number[]; color: string; unit: string }> = [
    { title: "Days to first automation, by signup month", values: [], color: "accent", unit: "d" },
    { title: "Sync errors per 1k runs, by week", values: [], color: "danger", unit: "" },
    { title: "Approvals waiting > 24 h, by month", values: [], color: "warning", unit: "" },
    { title: "Tickets by tag (90 days)", values: [], color: "muted", unit: "" },
    { title: "NPS by segment", values: [], color: "success", unit: "" },
    { title: "Fuel spend vs plan (k€), by month", values: [], color: "accent", unit: "k€" },
  ];
  const series = [
    Array.from({ length: 12 }, (_, i) => 14 - i * 0.6 + r.range(-2, 2)),
    Array.from(
      { length: 24 },
      (_, i) => 6 + Math.sin(i / 3) * 2 + (i > 15 ? 4 : 0) + r.range(-1, 1),
    ),
    Array.from({ length: 12 }, (_, i) => 30 + i * 2 + r.range(-6, 6)),
    [88, 61, 52, 40, 33, 22, 18, 12, 9, 5],
    [42, 31, 18, 12, -4, 25, 37, 8],
    Array.from({ length: 24 }, (_, i) => (i % 2 ? 9 + i * 0.2 : 8 + i * 0.35) + r.range(-1, 1)),
  ];
  charts.forEach((c, i) => {
    const x = mx + 50 + (i % 2) * 1170;
    const y = my + 130 + Math.floor(i / 2) * 800;
    b.shape("rectangle", { x, y, w: 1120, h: 760 }, SOLID("raised"), STROKE("line", 1));
    b.text(x + 24, y + 20, c.title, 20);
    const values = series[i]!;
    const max = Math.max(...values.map(Math.abs));
    const base = y + 640;
    b.pen(
      [
        { x: x + 40, y: base },
        { x: x + 1080, y: base },
      ],
      "muted",
      1,
    );
    const slot = 1000 / values.length;
    values.forEach((v, k) => {
      const h = Math.max(4, (Math.abs(v) / max) * 500);
      b.shape(
        "rectangle",
        { x: x + 60 + k * slot, y: v >= 0 ? base - h : base, w: slot * 0.7, h },
        i === 5 && k % 2
          ? { type: "pattern", pattern: "hatch", color: "muted" }
          : SOLID(c.color, 0.85),
        STROKE(null, 0),
      );
      if (values.length <= 12)
        b.text(x + 50 + (k + 0.35) * slot, base + 16, `${Math.round(v)}${c.unit}`, 14, "muted");
    });
    if (i === 1) b.circle({ x: x + 60 + 16 * slot, y: base - 420, w: slot * 7, h: 400 }, "danger");
    if (i === 2) b.handwriting(x + 700, y + 90, 300, "warning");
  });

  /* -- Reactions on notes: "+1" stamps and hearts */
  for (let i = 0; i < 70; i++) {
    const n = r.pick(problemNotes);
    b.text(
      n.bounds.x + n.bounds.w - 40 + r.range(-6, 6),
      n.bounds.y - 14 + r.range(-6, 6),
      r.pick(["+1", "+1", "!!", "<3", "?"]),
      18,
      r.pick(["accent", "warning", "danger"]),
    );
  }

  /* -- Loose marks: a full day of people drawing on the board */
  for (let i = 0; i < 90; i++) {
    const n = r.pick(problemNotes);
    const roll = r.next();
    const kind = roll < 0.35 ? 0 : roll < 0.65 ? 1 : roll < 0.9 ? 2 : 3;
    const nb = n.bounds;
    if (kind === 0)
      b.underline(nb.x + 10, nb.y + nb.h + 6, 140, r.pick(["accent", "danger", "ink"]));
    else if (kind === 1) b.check(nb.x + nb.w - 30, nb.y + 4, "success");
    else if (kind === 2) b.handwriting(nb.x, nb.y - 18, r.range(80, 160), "muted");
    else b.scribbleArrow({ x: nb.x - 120, y: nb.y - 80 }, { x: nb.x, y: nb.y + 20 }, "accent");
  }

  const items = b.done();
  return { items, json: serializeBoard(items, { x: 0, y: 0, zoom: 0.1 }) };
}
