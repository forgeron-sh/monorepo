import type * as React from "react";

/** Bouton. `primary` = plein en `inverse` (une seule action principale par vue). */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"; // défaut "secondary"
  size?: "sm" | "md" | "lg"; // défaut "md" (32px)
  /** Raccourci clavier affiché à droite, ex. "⌘K". */
  kbd?: string;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;

/** Étiquette courte : interface, statut, rôle. */
export interface BadgeProps {
  tone?: "neutral" | "strong" | "success" | "warning" | "danger"; // défaut "neutral"
  /** Pastille avant le texte (états). */
  dot?: boolean;
  /** Police mono (identifiants : MCP, API, v1.4.0). */
  mono?: boolean;
  className?: string;
  children: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;

/** Environnement d'une version. Libellé par défaut : Production, Pilote, Preview. */
export interface EnvTagProps {
  env: "production" | "pilot" | "preview";
  children?: React.ReactNode;
  className?: string;
}
export declare function EnvTag(props: EnvTagProps): JSX.Element;

/** Champ texte avec libellé, aide et erreur reliés en aria. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Police mono pour clés, URL, identifiants. */
  mono?: boolean;
}
export declare function Input(props: InputProps): JSX.Element;

/** Bloc de code / terminal avec bouton Copier. Les lignes qui commencent par "$ " sont des commandes. */
export interface CodeBlockProps {
  code: string;
  /** En-tête : nom de fichier ou contexte ("forgeron.config.ts"). */
  title?: string;
  lang?: string;
  className?: string;
}
export declare function CodeBlock(props: CodeBlockProps): JSX.Element;

/** Carte d'un internal tool dans le catalogue de l'espace. */
export interface ToolCardProps {
  name: string;
  description?: string;
  /** Version déployée, ex. "v1.4.0". */
  version?: string;
  env?: "production" | "pilot" | "preview";
  interfaces?: Array<"mcp" | "api" | "web" | "cli">;
  /** Ligne de pied, ex. "42 utilisateurs". */
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
  env?: "production" | "pilot" | "preview";
  status: "live" | "building" | "failed" | "superseded";
}
/** Historique des versions d'un tool, la plus récente en haut. */
export interface DeploymentListProps {
  items: Deployment[];
  className?: string;
}
export declare function DeploymentList(props: DeploymentListProps): JSX.Element;

/** Matrice actions × rôles. Cases cochables ; `locked` fige une colonne (ex. Propriétaire). */
export interface PermissionTableProps {
  roles: Array<{ id: string; label: string; locked?: boolean }>;
  actions: Array<{ name: string; kind?: string }>;
  /** grants[action][roleId] = true */
  grants?: Record<string, Record<string, boolean>>;
  onChange?: (grants: Record<string, Record<string, boolean>>) => void;
  className?: string;
}
export declare function PermissionTable(props: PermissionTableProps): JSX.Element;
