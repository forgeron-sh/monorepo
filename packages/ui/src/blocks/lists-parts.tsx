// The shape of an issue and of a group of issues, as the issue list and the issue board take them.

import type { ReactNode } from "react";
import { parseIso } from "../dates";
import { type PriorityLevel, type StatusKind } from "../glyphs";

/** An issue as a list or a board shows it. */
export interface IssueItem {
  /** The identifier, e.g. `OPS-40`: shown in mono, and the key of the row. */
  id: string;
  title: string;
  status: StatusKind;
  /** 0 or absent: no priority. */
  priority?: PriorityLevel;
  /** Values of `labels` given to the list or the board. */
  labels?: ReadonlyArray<string>;
  /** `YYYY-MM-DD`. Before `today` and not closed, it reads as overdue. */
  due?: string;
  /** The id of a person of `people`; `null` or absent: nobody. */
  assignee?: string | null;
  /** Who wrote it: the id of a person of `people`. Shown only when `properties` asks for it. */
  author?: string | null;
}

/** A group of the list or a column of the board: the issues of one status, one person… */
export interface IssueGroup {
  key: string;
  name: string;
  /** Draws the status mark before the name. */
  status?: StatusKind;
  /** Any other mark before the name (an avatar, a swatch); wins over `status`. */
  glyph?: ReactNode;
  issues: ReadonlyArray<IssueItem>;
}

/**
 * The properties a row or a card can show. The identifier, status and title of a card always
 * show. `author` shows only when asked for; the others by default.
 */
export type IssueProperty = "id" | "priority" | "status" | "labels" | "due" | "assignee" | "author";

export const thisYear = (today: string | undefined) =>
  today === undefined ? undefined : parseIso(today).getFullYear();
