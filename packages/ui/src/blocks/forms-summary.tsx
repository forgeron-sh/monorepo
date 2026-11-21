// What came back: one small chart per question (bars for choices and rankings, a histogram for
// ratings, scales and numbers, a list for text, a grid for a matrix), with how many answered and
// how many skipped. Conditional questions are counted only for the people who were shown them.
//
// Both blocks here are a root and parts; with no children the root draws them all:
//
//   <ResponseSummary schema={schema} responses={responses}>
//     <ResponseSummaryTotals />
//     <ResponseSummaryEmpty />
//     <ResponseSummaryList />
//   </ResponseSummary>
//
//   <ShareLinkPanel url={url}>
//     <ShareLinkPanelLink />
//     <ShareLinkPanelSwitch />
//   </ShareLinkPanel>

import {
  createContext,
  useContext,
  useId,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { BarChart } from "../charts/bar-chart";
import { Button } from "../button";
import { Switch } from "../controls";
import { CopyBlock } from "../copy-block";
import { cx } from "../cx";
import { useControllableState } from "../hooks/use-controllable";
import {
  formPercent,
  formQuestionInfo,
  summarizeForm,
  type FormResponse,
  type FormSchema,
  type FormSummary,
  type QuestionSummary,
  type SummaryBucket,
} from "./forms-model";
import { partContext } from "../part";

/* ---------------------------------------------------------------- Pieces */

/** Columns that rise with the count: a histogram, every column with its number and label. */
function Histogram({ title, buckets }: { title: string; buckets: ReadonlyArray<SummaryBucket> }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  // The one tallest column stands out in ember; a tie stands out nowhere.
  const tops = buckets.filter((b) => b.count === max && b.count > 0);
  const lead = tops.length === 1 ? tops[0]!.id : null;
  return (
    <figure className="fg-fm-hist">
      <figcaption className="fg-sr">{title}</figcaption>
      <ul className="fg-fm-hist-cols">
        {buckets.map((b) => (
          <li key={b.id} className={cx("fg-fm-hist-col", b.id === lead && "fg-fm-hist-top")}>
            <span className="fg-fm-hist-count">{b.count}</span>
            <span className="fg-fm-hist-track" aria-hidden="true">
              <span className="fg-fm-hist-bar" style={{ height: `${(b.count / max) * 100}%` }} />
            </span>
            <span className="fg-fm-hist-label">{b.label}</span>
            <span className="fg-sr"> answers: {b.count}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function Quotes({ texts, limit }: { texts: ReadonlyArray<string>; limit: number }) {
  const [all, setAll] = useState(false);
  const id = useId();
  const shown = all ? texts : texts.slice(0, limit);
  return (
    <div className="fg-fm-quotes">
      <ul className="fg-fm-quotes-list" id={id}>
        {shown.map((t, i) => (
          <li key={`${i}-${t}`} className="fg-fm-quote">
            {t}
          </li>
        ))}
      </ul>
      {texts.length > limit ? (
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={all}
          aria-controls={id}
          onClick={() => setAll(!all)}
        >
          {all ? "Show fewer" : `Show all ${texts.length}`}
        </Button>
      ) : null}
    </div>
  );
}

function MatrixGrid({ s }: { s: QuestionSummary }) {
  const m = s.matrix!;
  const max = Math.max(1, ...m.rows.flatMap((r) => r.counts));
  return (
    <div className="fg-fm-sum-matrix">
      <table>
        <caption className="fg-sr">{s.question.title}</caption>
        <thead>
          <tr>
            <td />
            {m.columns.map((c) => (
              <th key={c.id} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {m.rows.map((r) => (
            <tr key={r.id}>
              <th scope="row">{r.label}</th>
              {r.counts.map((n, i) => (
                <td
                  key={m.columns[i]!.id}
                  style={{ ["--fg-fm-heat" as string]: `${Math.round((n / max) * 45)}%` }}
                >
                  {n}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestionBody({ s, quotes }: { s: QuestionSummary; quotes: number }) {
  const q = s.question;
  const title = q.title || formQuestionInfo(q.type).label;
  if (s.answered === 0) return <p className="fg-fm-sum-none">No answer yet.</p>;
  switch (s.kind) {
    case "choices":
      return (
        <BarChart
          title={title}
          data={s.buckets.map((b) => ({ label: b.label, value: b.count }))}
          format={(v) => `${v} · ${formPercent(v / s.answered)}`}
        />
      );
    case "ranking":
      return (
        <BarChart
          title={title}
          data={s.buckets.map((b) => ({
            label: b.meanRank ? `${b.label} (avg place ${b.meanRank})` : b.label,
            value: b.count,
          }))}
          format={(v) => `${v} pts`}
        />
      );
    case "histogram":
      return (
        <div className="fg-fm-sum-hist">
          <Histogram title={title} buckets={s.buckets} />
          <p className="fg-fm-sum-stats">
            {s.mean !== undefined ? <span>Mean {s.mean}</span> : null}
            {s.median !== undefined ? <span>Median {s.median}</span> : null}
          </p>
          {s.nps ? (
            <dl className="fg-fm-nps">
              <div className="fg-fm-nps-score">
                <dt>NPS</dt>
                <dd>{s.nps.score > 0 ? `+${s.nps.score}` : s.nps.score}</dd>
              </div>
              <div>
                <dt>Promoters</dt>
                <dd>{s.nps.promoters}</dd>
              </div>
              <div>
                <dt>Passives</dt>
                <dd>{s.nps.passives}</dd>
              </div>
              <div>
                <dt>Detractors</dt>
                <dd>{s.nps.detractors}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      );
    case "texts":
      return <Quotes texts={s.texts ?? []} limit={quotes} />;
    case "matrix":
      return <MatrixGrid s={s} />;
    default:
      return (
        <p className="fg-fm-sum-none">
          {s.answered} {s.answered === 1 ? "answer" : "answers"}.
        </p>
      );
  }
}

/* ---------------------------------------------------------------- ResponseSummary */

interface SummaryContext {
  sum: FormSummary;
  textLimit: number;
}

const [SummaryCtx, useResponseSummary] = partContext<SummaryContext>("ResponseSummary");

/** The state of the enclosing `ResponseSummary`: the tally of the responses. */
export { useResponseSummary };

/** The summary of the question a `ResponseSummaryQuestion` draws, for the parts inside it. */
const QuestionCtx = createContext<{ s: QuestionSummary; index: number } | null>(null);

function useSummaryQuestion(part: string) {
  const ctx = useContext(QuestionCtx);
  if (!ctx) throw new Error(`<${part}> goes inside a <ResponseSummaryQuestion>.`);
  return { ...ctx, ...useResponseSummary() };
}

/** Responses, completion and the number of questions. Its children replace the three figures. */
export function ResponseSummaryTotals({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"dl">, "ref">) {
  const { sum } = useResponseSummary();
  return (
    <dl data-slot="response-summary-totals" {...rest} className={cx("fg-fm-sum-top", className)}>
      {children ?? (
        <>
          <div>
            <dt>Responses</dt>
            <dd>{sum.responses}</dd>
          </div>
          <div className="fg-fm-sum-next">
            <dt>Completed</dt>
            <dd>{sum.responses ? formPercent(sum.completion) : "–"}</dd>
          </div>
          <div className="fg-fm-sum-next">
            <dt>Questions</dt>
            <dd>{sum.questions.length}</dd>
          </div>
        </>
      )}
    </dl>
  );
}

/** "No response yet", shown only while there is no response. */
export function ResponseSummaryEmpty({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"p">, "ref">) {
  const { sum } = useResponseSummary();
  if (sum.responses !== 0) return null;
  return (
    <p data-slot="response-summary-empty" {...rest} className={cx("fg-fm-sum-none", className)}>
      {children ?? "No response yet."}
    </p>
  );
}

/** The number, the title and the type of the question. */
export function ResponseSummaryQuestionHead({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"div">, "ref">) {
  const { s, index } = useSummaryQuestion("ResponseSummaryQuestionHead");
  return (
    <div
      data-slot="response-summary-question-head"
      {...rest}
      className={cx("fg-fm-sum-head", className)}
    >
      {children ?? (
        <>
          <span className="fg-fm-sum-n">{index + 1}</span>
          <h3 className="fg-fm-sum-title">
            {s.question.title || formQuestionInfo(s.question.type).label}
          </h3>
          <span className="fg-fm-sum-type">{formQuestionInfo(s.question.type).label}</span>
        </>
      )}
    </div>
  );
}

/** How many answered, skipped, and to how many the question was shown. */
export function ResponseSummaryQuestionMeta({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"p">, "ref">) {
  const { s, sum } = useSummaryQuestion("ResponseSummaryQuestionMeta");
  return (
    <p
      data-slot="response-summary-question-meta"
      {...rest}
      className={cx("fg-fm-sum-meta", className)}
    >
      {children ?? (
        <>
          {s.answered} answered
          {s.skipped ? `, ${s.skipped} skipped` : ""}
          {s.asked < sum.responses ? `, shown to ${s.asked}` : ""}
        </>
      )}
    </p>
  );
}

/** The chart of the answers: bars, a histogram, quotes or a grid, by kind of question. */
export function ResponseSummaryQuestionBody() {
  const { s, sum, textLimit } = useSummaryQuestion("ResponseSummaryQuestionBody");
  return sum.responses ? <QuestionBody s={s} quotes={textLimit} /> : null;
}

export interface ResponseSummaryQuestionProps extends Omit<ComponentProps<"li">, "ref"> {
  /** The place of the question in the form, from 0. */
  index: number;
}

/** One question of the summary. Its children replace the head, the meta and the chart. */
export function ResponseSummaryQuestion({
  index,
  className,
  children,
  ...rest
}: ResponseSummaryQuestionProps) {
  const { sum } = useResponseSummary();
  const s = sum.questions[index];
  if (!s) return null;
  return (
    <QuestionCtx.Provider value={{ s, index }}>
      <li
        data-slot="response-summary-question"
        {...rest}
        className={cx("fg-fm-sum-card", className)}
      >
        {children ?? (
          <>
            <ResponseSummaryQuestionHead />
            <ResponseSummaryQuestionMeta />
            <ResponseSummaryQuestionBody />
          </>
        )}
      </li>
    </QuestionCtx.Provider>
  );
}

/** The questions, one card each. Its children replace the cards. */
export function ResponseSummaryList({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"ol">, "ref">) {
  const { sum } = useResponseSummary();
  return (
    <ol data-slot="response-summary-list" {...rest} className={cx("fg-fm-sum-list", className)}>
      {children ??
        sum.questions.map((s, i) => <ResponseSummaryQuestion key={s.question.id} index={i} />)}
    </ol>
  );
}

export interface ResponseSummaryProps extends Omit<ComponentProps<"section">, "ref" | "children"> {
  schema: FormSchema;
  responses: ReadonlyArray<FormResponse>;
  /** Names the summary for assistive technology. Default "Responses". */
  label?: string;
  /** How many text answers show before "Show all". Default 4. */
  textLimit?: number;
  /** The parts. Without them: the totals, the empty note and the list. */
  children?: ReactNode;
}

/** One mini-chart per question, with the number of responses and how many finished the form. */
export function ResponseSummary({
  schema,
  responses,
  label = "Responses",
  textLimit = 4,
  children,
  className,
  ...rest
}: ResponseSummaryProps) {
  const sum = summarizeForm(schema, responses);
  return (
    <SummaryCtx.Provider value={{ sum, textLimit }}>
      <section
        data-slot="response-summary"
        {...rest}
        className={cx("fg-fm-sum", className)}
        aria-label={label}
      >
        {children ?? (
          <>
            <ResponseSummaryTotals />
            <ResponseSummaryEmpty />
            <ResponseSummaryList />
          </>
        )}
      </section>
    </SummaryCtx.Provider>
  );
}

/* ---------------------------------------------------------------- ShareLinkPanel */

interface ShareContext {
  url: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  closedMessage: string;
}

const [ShareCtx, useShareLinkPanel] = partContext<ShareContext>("ShareLinkPanel");

/** The state of the enclosing `ShareLinkPanel`: the address and whether it takes responses. */
export { useShareLinkPanel };

/** The link of the form, to copy. */
export function ShareLinkPanelLink({ label = "Link to the form" }: { label?: string }) {
  const { url } = useShareLinkPanel();
  return <CopyBlock data-slot="share-link-panel-link" label={label} value={url} />;
}

/** The snippet that embeds the form in a page. */
export function ShareLinkPanelEmbed({ label = "Embed code" }: { label?: string }) {
  const { url } = useShareLinkPanel();
  return (
    <CopyBlock
      data-slot="share-link-panel-embed"
      label={label}
      value={`<iframe src="${url}" title="Form" width="100%" height="640" style="border:0"></iframe>`}
    />
  );
}

/** The switch that stops the form taking responses. */
export function ShareLinkPanelSwitch({ label = "Accepting responses" }: { label?: string }) {
  const { open, setOpen } = useShareLinkPanel();
  return (
    <Switch
      data-slot="share-link-panel-switch"
      label={label}
      checked={open}
      onChange={(event) => setOpen(event.target.checked)}
    />
  );
}

/** What anyone who opens the link is told once the form is closed; nothing while it is open. */
export function ShareLinkPanelClosed({
  className,
  children,
  ...rest
}: Omit<ComponentProps<"p">, "ref">) {
  const { open, closedMessage } = useShareLinkPanel();
  if (open) return null;
  return (
    <p
      data-slot="share-link-panel-closed"
      {...rest}
      className={cx("fg-fm-share-closed", className)}
    >
      {children ?? closedMessage}
    </p>
  );
}

export interface ShareLinkPanelProps extends Omit<
  ComponentProps<"section">,
  "ref" | "children" | "defaultValue"
> {
  /** The public address of the form. */
  url: string;
  /** Whether the form takes responses. Controlled or not. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Writes an iframe snippet under the link. Default `true`. */
  embed?: boolean;
  /** Said when the form is closed. */
  closedMessage?: string;
  /** The parts. Without them: the link, the snippet, the switch and the closed note. */
  children?: ReactNode;
}

/** The link of a form to copy, a switch to stop taking responses, and the snippet to embed it. */
export function ShareLinkPanel({
  url,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  embed = true,
  closedMessage = "The form is closed. Anyone who opens the link is told so.",
  children,
  className,
  ...rest
}: ShareLinkPanelProps) {
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return (
    <ShareCtx.Provider value={{ url, open, setOpen, closedMessage }}>
      <section
        data-slot="share-link-panel"
        aria-label="Share the form"
        {...rest}
        className={cx("fg-fm-share", className)}
      >
        {children ?? (
          <>
            <ShareLinkPanelLink />
            {embed ? <ShareLinkPanelEmbed /> : null}
            <ShareLinkPanelSwitch />
            <ShareLinkPanelClosed />
          </>
        )}
      </section>
    </ShareCtx.Provider>
  );
}
