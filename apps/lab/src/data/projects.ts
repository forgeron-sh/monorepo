import {
  BookOpenTextIcon,
  DrawingCompassIcon,
  FeatherIcon,
  FileTextIcon,
  FlowIcon,
  Grid3x3Icon,
  type IconDefinition,
  Layers02Icon,
  MagicWand04Icon,
  ShapeCollectionIcon,
  WhiteboardIcon,
} from "@forgeron/icons";

/**
 * The two states of a lab project. `stable`: versioned, used by Forgeron's own apps, safe to
 * build on. `experimental`: moving fast, its API may change from one week to the next.
 */
export type Status = "stable" | "experimental";

/** What a project is about; the same words tag the papers. */
export type Area = "Design system" | "Type" | "Graphics" | "Editors" | "Writing";

/** Which drawing stands for the project in its card (`ProjectArt.astro`). */
export type Art =
  | "icons"
  | "ui"
  | "font"
  | "shaders"
  | "blueprint"
  | "canvas"
  | "draw"
  | "flow"
  | "richtext"
  | "quill";

export interface Project {
  /** The permanent index of the project: `L-01`. Never reused. */
  id: string;
  slug: string;
  name: string;
  status: Status;
  area: Area;
  /** One line: what it is. */
  line: string;
  /** Short facts for the project page, one line each. */
  points: readonly string[];
  /** The npm name. */
  pkg: string;
  /** Its folder in the repository, read for the last change. */
  dir: string;
  /** Its own site, when one is online. */
  site?: string;
  /** A site that is built but not online yet. */
  siteSoon?: string;
  icon: IconDefinition;
  art: Art;
}

export const PROJECTS: readonly Project[] = [
  {
    id: "L-01",
    slug: "icons",
    name: "Icons",
    status: "stable",
    area: "Design system",
    line: "Pixel icons on a 12-pixel grid, monotone and duotone.",
    points: [
      "Every icon drawn by hand, every name ours",
      "One named export per icon, dropped when unused",
      "Monotone and duotone, a filled variant where the shape is closed",
      "Judged at 16, 24 and 48 px, on dark and on light",
    ],
    pkg: "@forgeron/icons",
    dir: "packages/icons",
    site: "https://icons.forgeron.sh",
    icon: Grid3x3Icon,
    art: "icons",
  },
  {
    id: "L-02",
    slug: "ui",
    name: "UI",
    status: "stable",
    area: "Design system",
    line: "The React components and tokens of the lab language.",
    points: [
      "Atoms, blocks and marketing sections in one package",
      "Tokens generated from one JSON source, dark and light",
      "The pixel effects as React wrappers over Shaders",
      "The base of forgeron.sh, the console and every lab site",
    ],
    pkg: "@forgeron/ui",
    dir: "packages/ui",
    siteSoon: "ui.forgeron.sh",
    icon: Layers02Icon,
    art: "ui",
  },
  {
    id: "L-03",
    slug: "font",
    name: "Forgeron Sans",
    status: "stable",
    area: "Type",
    line: "The pixel typeface of the brand, on a 5-pixel grid.",
    points: [
      "Regular, Medium and Bold, one pixel apart",
      "OpenType files and a glyph table for code",
      "Sharp at every multiple of 10 px",
      "SIL Open Font License 1.1",
    ],
    pkg: "@forgeron/font",
    dir: "packages/font",
    site: "https://font.forgeron.sh",
    icon: BookOpenTextIcon,
    art: "font",
  },
  {
    id: "L-04",
    slug: "shaders",
    name: "Shaders",
    status: "experimental",
    area: "Graphics",
    line: "Pixel effects as chains of passes, in GLSL and on the CPU.",
    points: [
      "A source, a chain of passes, an output",
      "Every pass written twice, with the same result",
      "Settings as versioned JSON presets",
      "Live canvas, or static PNG and SVG at build time",
    ],
    pkg: "@forgeron/shaders",
    dir: "packages/shaders",
    icon: MagicWand04Icon,
    art: "shaders",
  },
  {
    id: "L-05",
    slug: "blueprint",
    name: "Blueprint",
    status: "experimental",
    area: "Graphics",
    line: "Isometric pixel scenes, described in JSON, drawn by a Rust core.",
    points: [
      "Parts, assemblies and scenes in one .bp file",
      "Timelines and state machines for motion",
      "A WebAssembly core, the same at build time",
      "Static SVG with no JavaScript, or a live canvas",
    ],
    pkg: "@forgeron/blueprint",
    dir: "packages/blueprint",
    siteSoon: "blueprint.forgeron.sh",
    icon: ShapeCollectionIcon,
    art: "blueprint",
  },
  {
    id: "L-06",
    slug: "canvas",
    name: "Canvas",
    status: "experimental",
    area: "Editors",
    line: "The infinite surface under every editor, drawn on the GPU.",
    points: [
      "Pan, zoom, snapping and the pixel grid",
      "Hit testing, box and lasso selection",
      "Undo, redo, JSON and the minimap",
      "Knows nothing of what an item is",
    ],
    pkg: "@forgeron/canvas",
    dir: "packages/canvas",
    icon: DrawingCompassIcon,
    art: "canvas",
  },
  {
    id: "L-07",
    slug: "draw",
    name: "Draw",
    status: "experimental",
    area: "Editors",
    line: "A whiteboard on Canvas where every feature is a plugin.",
    points: [
      "Shapes, sticky notes, text and a pixel pen",
      "Arrows bound to the items they join",
      "Frames, images, PNG and SVG export",
      "A minimal core: add, remove or write plugins",
    ],
    pkg: "@forgeron/draw",
    dir: "packages/draw",
    icon: WhiteboardIcon,
    art: "draw",
  },
  {
    id: "L-08",
    slug: "flow",
    name: "Flow",
    status: "experimental",
    area: "Editors",
    line: "A node-graph editor on Canvas, with typed ports and auto-layout.",
    points: [
      "Nodes, typed ports, edges and groups",
      "A layered auto-layout",
      "The run state of each node and edge",
      "The editor of Forgeron's automations",
    ],
    pkg: "@forgeron/flow",
    dir: "packages/flow",
    icon: FlowIcon,
    art: "flow",
  },
  {
    id: "L-09",
    slug: "richtext",
    name: "Rich text",
    status: "experimental",
    area: "Editors",
    line: "A block editor for notes, descriptions and comments.",
    points: [
      "Tiptap 3 in headless mode, our interface on top",
      "Slash menu, blocks and pixel icons",
      "Yjs wired in for real-time collaboration",
      "Nothing in it knows an app",
    ],
    pkg: "@forgeron/richtext",
    dir: "packages/richtext",
    siteSoon: "richtext.forgeron.sh",
    icon: FileTextIcon,
    art: "richtext",
  },
  {
    id: "L-10",
    slug: "quill",
    name: "Quill",
    status: "experimental",
    area: "Writing",
    line: "A writing framework for agents: posts, stories, papers and changelogs.",
    points: [
      "An onboarding interview writes who you are, your readers and your voice",
      "Six formats, each drawn from named blogs, style guides and papers",
      "Fifty tells of generated prose, banned or capped, fixed from the facts",
      "Every claim traced to a source, or marked as missing",
      "A review in four passes and a cold read",
    ],
    pkg: "@forgeron/quill",
    dir: "packages/quill",
    icon: FeatherIcon,
    art: "quill",
  },
];

export const STATUS: Record<Status, { label: string; line: string }> = {
  stable: { label: "Stable", line: "Versioned and used in production. Build on it." },
  experimental: { label: "Experimental", line: "Moving fast. The API may change any week." },
};

export function projectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
