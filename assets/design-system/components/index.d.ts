import type * as React from "react";

/** Bouton. `primary` = filled in `inverse` (one primary action per view). */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"; // default "secondary"
  size?: "sm" | "md" | "lg"; // default "md" (32px)
  /** Keyboard shortcut shown on the right, e.g. "⌘K". */
  kbd?: string;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;

/** Short tag: interface, status, role. */
export interface BadgeProps {
  tone?: "neutral" | "strong" | "success" | "warning" | "danger"; // default "neutral"
  /** Dot before the text (states). */
  dot?: boolean;
  /** Mono font (identifiers: MCP, API, v1.4.0). */
  mono?: boolean;
  className?: string;
  children: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;

/** Environment of a version. Default label: Production, Preview. */
export interface EnvTagProps {
  env: "production" | "preview";
  children?: React.ReactNode;
  className?: string;
}
export declare function EnvTag(props: EnvTagProps): JSX.Element;

/** Text field with label, hint and error wired up via aria. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Mono font for keys, URLs, identifiers. */
  mono?: boolean;
}
export declare function Input(props: InputProps): JSX.Element;

/** Code block / terminal with a Copy button. Lines starting with "$ " are commands. */
export interface CodeBlockProps {
  code: string;
  /** Header: file name or context ("forgeron.config.ts"). */
  title?: string;
  lang?: string;
  className?: string;
}
export declare function CodeBlock(props: CodeBlockProps): JSX.Element;

/** Card for an internal tool in the workspace catalog. */
export interface ToolCardProps {
  name: string;
  description?: string;
  /** Deployed version, e.g. "v1.4.0". */
  version?: string;
  env?: "production" | "preview";
  interfaces?: Array<"mcp" | "api" | "web" | "cli">;
  /** Footer line, e.g. "42 users". */
  meta?: string;
  className?: string;
}
export declare function ToolCard(props: ToolCardProps): JSX.Element;

export interface Deployment {
  version: string;
  message: string;
  commit: string;
  author: string;
  time: string;
  env?: "production" | "preview";
  status: "live" | "building" | "failed" | "superseded";
}
/** Version history of a tool, most recent on top. */
export interface DeploymentListProps {
  items: Deployment[];
  className?: string;
}
export declare function DeploymentList(props: DeploymentListProps): JSX.Element;

/** Actions × roles matrix. Checkable cells; `locked` freezes a column (e.g. Owner). */
export interface PermissionTableProps {
  roles: Array<{ id: string; label: string; locked?: boolean }>;
  actions: Array<{ name: string; kind?: string }>;
  /** grants[action][roleId] = true */
  grants?: Record<string, Record<string, boolean>>;
  onChange?: (grants: Record<string, Record<string, boolean>>) => void;
  className?: string;
}
export declare function PermissionTable(props: PermissionTableProps): JSX.Element;
