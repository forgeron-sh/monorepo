import registry from "../registry.json" with { type: "json" };

/** How a skill is reached: by the agent from its description, or only when typed by a person. */
export type Invocation = "model" | "user";

export interface QuillSkill {
  /** The skill's folder under `skills/`, and the `name` of its front matter. */
  name: string;
  invocation: Invocation;
  /** What it is for, in one line. */
  role: string;
}

/** A source a format's rules were drawn from. */
export interface Source {
  name: string;
  url: string;
}

/** A kind of piece Quill writes: its guide is `skills/quill/formats/<id>.md`. */
export interface QuillFormat {
  id: string;
  name: string;
  /** One line: what the piece is and when to choose it. */
  summary: string;
  inspiredBy: readonly Source[];
}

export interface QuillRegistry {
  skills: readonly QuillSkill[];
  /** The context files `quill-setup` writes in a project's `.quill/` folder, read before any piece. */
  context: readonly string[];
  formats: readonly QuillFormat[];
  /** The skills Quill's own skills were modelled on. */
  skillSources: readonly Source[];
}

/** The registry: Quill's skills, the context they read, and the formats they write. */
export const QUILL: QuillRegistry = registry as QuillRegistry;

export function formatById(id: string): QuillFormat | undefined {
  return QUILL.formats.find((f) => f.id === id);
}
