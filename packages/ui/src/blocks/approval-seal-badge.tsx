// The proof that something was signed or approved: who, when (with the time zone), how, and the
// first characters of the hash of what they acted on. A small stamp for the margin of a document,
// a row of an audit or the end of an email.
//
// With props it is the usual stamp (its children go at the end of it). With parts as children it
// is a frame, and the parts compose it:
//
//   <SealBadge action="Signed" who="Léa Martin" at="2026-11-19T14:32:10Z" hash="9f2c…">
//     <SealBadgeMark />
//     <SealBadgeBody>
//       <SealBadgeTop /><SealBadgeWho /><SealBadgeFacts />
//     </SealBadgeBody>
//   </SealBadge>

import { SealIcon } from "@forgeron/icons";
import { createContext, useContext, type ReactNode } from "react";
import { cx } from "../cx";
import { Icon } from "../icon";
import { formatStamp, hashPrefix } from "./approval-model";
import { hasPart, part, type PartProps } from "../part";

type SealState = "valid" | "revoked" | "unverified";

const STATES = {
  valid: "Verified",
  revoked: "Revoked",
  unverified: "Not verified",
} as const;

interface SealContext {
  action: string;
  who: string;
  detail: string | undefined;
  at: string;
  stamp: string;
  method: string | undefined;
  prefix: string;
  state: SealState;
}
const SealCtx = createContext<SealContext | null>(null);

function useSeal(name: string): SealContext {
  const ctx = useContext(SealCtx);
  if (!ctx) throw new Error(`<${name}> goes inside a <SealBadge>.`);
  return ctx;
}

/* ---------------------------------------------------------------- parts */

/** The seal's mark. */
export function SealBadgeMark({ children, ...rest }: PartProps<"span">) {
  return part(
    "span",
    "seal-badge-mark",
    "fg-seal-mark",
    { ...rest, children: children ?? <Icon icon={SealIcon} size={24} variant="mono" /> },
    { "aria-hidden": "true" },
  );
}

/** What is beside the mark. */
export function SealBadgeBody(props: PartProps<"div">) {
  return part("div", "seal-badge-body", "fg-seal-body", props);
}

/** The action and its state: "Signed" and "Verified". */
export function SealBadgeTop({ children, ...rest }: PartProps<"p">) {
  const { action, state } = useSeal("SealBadgeTop");
  return part("p", "seal-badge-top", "fg-seal-top", {
    ...rest,
    children: children ?? (
      <>
        <span className="fg-seal-action">{action}</span>
        <span className="fg-seal-state">{STATES[state]}</span>
      </>
    ),
  });
}

/** Who did it, with their role or email. */
export function SealBadgeWho({ children, ...rest }: PartProps<"p">) {
  const { who, detail } = useSeal("SealBadgeWho");
  return part("p", "seal-badge-who", "fg-seal-who", {
    ...rest,
    children: children ?? (
      <>
        <b>{who}</b>
        {detail ? <span className="fg-seal-detail"> · {detail}</span> : null}
      </>
    ),
  });
}

/** When, how and the hash prefix, as a list of facts. */
export function SealBadgeFacts({ children, ...rest }: PartProps<"dl">) {
  const { at, stamp, method, prefix } = useSeal("SealBadgeFacts");
  return part("dl", "seal-badge-facts", "fg-seal-facts", {
    ...rest,
    children: children ?? (
      <>
        <div>
          <dt>When</dt>
          <dd>
            <time dateTime={at}>{stamp}</time>
          </dd>
        </div>
        {method ? (
          <div>
            <dt>Method</dt>
            <dd>{method}</dd>
          </div>
        ) : null}
        {prefix ? (
          <div>
            <dt>Hash</dt>
            <dd>
              <code title="The first characters of the hash of the signed content">{prefix}</code>
            </dd>
          </div>
        ) : null}
      </>
    ),
  });
}

/* ---------------------------------------------------------------- the seal */

export interface SealBadgeProps extends Omit<PartProps<"figure">, "children"> {
  /** What was done: "Signed", "Approved", "Validated". */
  action?: string;
  /** Who did it. */
  who: string;
  /** The role or the email under the name. */
  detail?: string;
  /** When: an ISO timestamp (`2026-11-19T14:32:10Z`). */
  at: string;
  /** How: "Drawn signature", "Email code", "Single sign-on". */
  method?: string;
  /** The hash of what was signed; only the first characters are shown. */
  hash?: string;
  /** How many characters of the hash to show; 8 by default. */
  hashLength?: number;
  /** `valid` (default), `revoked`, `unverified`. The state is always written. */
  state?: SealState;
  /** A single line, for a margin or a table cell. */
  compact?: boolean;
  /** At the end of the seal: a link to the full proof. Or, the parts of the seal. */
  children?: ReactNode;
}

const PARTS = [SealBadgeMark, SealBadgeBody, SealBadgeTop, SealBadgeWho, SealBadgeFacts];

/** Proof of a signature or an approval: who, when, the hash prefix and the method. */
export function SealBadge({
  action = "Approved",
  who,
  detail,
  at,
  method,
  hash,
  hashLength = 8,
  state = "valid",
  compact = false,
  children,
  className,
  asChild,
  ...rest
}: SealBadgeProps) {
  const stamp = formatStamp(at);
  const prefix = hash ? hashPrefix(hash, hashLength) : "";
  const ctx: SealContext = { action, who, detail, at, stamp, method, prefix, state };
  const name = `${action} by ${who}, ${stamp}, ${STATES[state]}`;
  if (compact) {
    return (
      <SealCtx.Provider value={ctx}>
        {part(
          "span",
          "seal-badge",
          cx("fg-seal fg-seal-compact", `fg-seal-${state}`),
          {
            className,
            asChild,
            ...(rest as PartProps<"span">),
            children: (
              <>
                <Icon icon={SealIcon} size={12} variant="mono" />
                <span>
                  {action} by <b>{who}</b>
                </span>
                <time dateTime={at}>{stamp}</time>
                {prefix ? <code>{prefix}</code> : null}
              </>
            ),
          },
          { role: "group", "aria-label": name },
        )}
      </SealCtx.Provider>
    );
  }
  return (
    <SealCtx.Provider value={ctx}>
      {part(
        "figure",
        "seal-badge",
        cx("fg-seal", `fg-seal-${state}`),
        {
          className,
          asChild,
          ...rest,
          children: hasPart(children, PARTS) ? (
            children
          ) : (
            <>
              <SealBadgeMark />
              <SealBadgeBody>
                <SealBadgeTop />
                <SealBadgeWho />
                <SealBadgeFacts />
                {children}
              </SealBadgeBody>
            </>
          ),
        },
        { "aria-label": name },
      )}
    </SealCtx.Provider>
  );
}
