// What came back: one small chart per question (bars for choices and rankings, a histogram for
// ratings, scales and numbers, a list for text, a grid for a matrix), with how many answered and
// how many skipped. Conditional questions are counted only for the people who were shown them.

import { useId, useState } from "react";
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
  type QuestionSummary,
  type SummaryBucket,
} from "./forms-model";

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

export interface ResponseSummaryProps {
  schema: FormSchema;
  responses: ReadonlyArray<FormResponse>;
  /** Names the summary for assistive technology. Default "Responses". */
  label?: string;
  /** How many text answers show before "Show all". Default 4. */
  textLimit?: number;
  className?: string;
}

/** One mini-chart per question, with the number of responses and how many finished the form. */
export function ResponseSummary({
  schema,
  responses,
  label = "Responses",
  textLimit = 4,
  className,
}: ResponseSummaryProps) {
  const sum = summarizeForm(schema, responses);
  return (
    <section className={cx("fg-fm-sum", className)} aria-label={label}>
      <dl className="fg-fm-sum-top">
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
      </dl>
      {sum.responses === 0 ? <p className="fg-fm-sum-none">No response yet.</p> : null}
      <ol className="fg-fm-sum-list">
        {sum.questions.map((s, i) => (
          <li key={s.question.id} className="fg-fm-sum-card">
            <div className="fg-fm-sum-head">
              <span className="fg-fm-sum-n">{i + 1}</span>
              <h3 className="fg-fm-sum-title">
                {s.question.title || formQuestionInfo(s.question.type).label}
              </h3>
              <span className="fg-fm-sum-type">{formQuestionInfo(s.question.type).label}</span>
            </div>
            <p className="fg-fm-sum-meta">
              {s.answered} answered
              {s.skipped ? `, ${s.skipped} skipped` : ""}
              {s.asked < sum.responses ? `, shown to ${s.asked}` : ""}
            </p>
            {sum.responses ? <QuestionBody s={s} quotes={textLimit} /> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------------------------------------------------------------- ShareLinkPanel */

export interface ShareLinkPanelProps {
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
  className?: string;
}

/** The link of a form to copy, a switch to stop taking responses, and the snippet to embed it. */
export function ShareLinkPanel({
  url,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  embed = true,
  closedMessage = "The form is closed. Anyone who opens the link is told so.",
  className,
}: ShareLinkPanelProps) {
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  return (
    <section className={cx("fg-fm-share", className)} aria-label="Share the form">
      <CopyBlock label="Link to the form" value={url} />
      {embed ? (
        <CopyBlock
          label="Embed code"
          value={`<iframe src="${url}" title="Form" width="100%" height="640" style="border:0"></iframe>`}
        />
      ) : null}
      <Switch
        label="Accepting responses"
        checked={open}
        onChange={(event) => setOpen(event.target.checked)}
      />
      {open ? null : <p className="fg-fm-share-closed">{closedMessage}</p>}
    </section>
  );
}
