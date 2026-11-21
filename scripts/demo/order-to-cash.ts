// "Order-to-cash automation": the flow an ERP team runs on Odoo and Microsoft 365, as a flow
// document (version 1). Orders come in by webhook and by a catch-up schedule, are validated,
// go through credit checks and approvals, are invoiced per country (e-invoicing portals for the
// public sector), paid (Stripe, bank feed), dunned, refunded (a sub-flow) and reconciled, with a
// weekly AR report. Calls that can fail carry an `error` port, caught by a retry with backoff and a
// dead-letter queue. Ports are typed (`order`, `orders`, `invoice`, `payment`, `line`, `refund`,
// `report`, `error`, `any`); every edge goes through `connect`, so the rules hold.
//
// Each node's `data.run` says what it did in the demo run (the ports it fired, or an error);
// `demoOutcome` reads it for `planRun`. The same seed gives the same flow.

import {
  applyLayout,
  connect,
  layoutGraph,
  planRun,
  type FlowGraph,
  type FlowNode,
  type FlowPort,
  type NodeOutcome,
  type RunState,
} from "../../packages/flow/src/index";

/**
 * What a node did in the demo run: the outputs it fired (all but errors by default), or failed
 * (with `ports`, through its error output to a retry: handled).
 */
type DemoRun = { ports: string[] } | { status: "error"; ports?: string[] };

export interface DemoStep {
  /** The block of the gallery's catalog it is drawn as (icon, kind). */
  step: string;
  title: string;
  subtitle: string;
  values: Record<string, string>;
  run?: DemoRun;
}

/** The outcome of a node in the demo run, for `planRun`. */
export function demoOutcome(node: FlowNode<DemoStep>): NodeOutcome {
  const run = node.data.run;
  if (run && "status" in run) return run.ports ? { status: "error", ports: run.ports } : run;
  return {
    status: "success",
    ports: run?.ports ?? node.outputs.filter((p) => p.type !== "error").map((p) => p.id),
  };
}

const W = 240;
const H = 80;

type Src = { node: string; port: string };

class FlowBuilder {
  graph: FlowGraph<DemoStep> = { version: 1, nodes: [], edges: [], groups: [] };
  private group: { id: string; label: string; nodes: string[] } | null = null;
  private dead: string | null = null;
  private n = 0;
  private e = 0;

  begin(label: string) {
    this.group = { id: `g-${this.graph.groups.length + 1}`, label, nodes: [] };
    this.graph.groups.push(this.group);
    this.dead = null;
  }

  node(
    step: string,
    title: string,
    subtitle: string,
    inputs: FlowPort[],
    outputs: FlowPort[],
    run?: DemoRun,
  ): string {
    const id = `n${++this.n}`;
    const tall = Math.max(inputs.length, outputs.length);
    this.graph.nodes.push({
      id,
      type: step,
      position: { x: 0, y: 0 },
      size: { w: W, h: tall > 3 ? 40 + tall * 22 : H },
      inputs,
      outputs,
      data: { step, title, subtitle, values: {}, ...(run ? { run } : {}) },
    });
    this.group?.nodes.push(id);
    return id;
  }

  /** Joins every source to an input; a second edge into an input makes it a merge. */
  link(from: Src | Src[], to: string, port = "in") {
    for (const f of Array.isArray(from) ? from : [from]) {
      const target = this.graph.nodes.find((n) => n.id === to)!;
      const input = target.inputs.find((p) => p.id === port)!;
      if (this.graph.edges.some((e) => e.to.node === to && e.to.port === port))
        input.multiple = true;
      const r = connect(this.graph, f, { node: to, port }, { id: `e${++this.e}` });
      if (!r.ok) throw new Error(`${f.node}.${f.port} → ${to}.${port}: ${r.error}`);
      this.graph = r.graph;
    }
  }

  /* -- blocks */

  trigger(step: string, title: string, subtitle: string, type: string, run?: DemoRun): Src {
    return { node: this.node(step, title, subtitle, [], [{ id: "out", type }], run), port: "out" };
  }

  /** A step: from `from`, one input of `inType`, one output of `outType`. */
  step(
    from: Src | Src[],
    step: string,
    title: string,
    subtitle: string,
    inType: string,
    outType = inType,
    run?: DemoRun,
  ): Src {
    const id = this.node(
      step,
      title,
      subtitle,
      [{ id: "in", type: inType }],
      [{ id: "out", type: outType }],
      run,
    );
    this.link(from, id);
    return { node: id, port: "out" };
  }

  /**
   * A call that can fail: its `error` output goes to a retry with backoff, whose `ok` carries the
   * same items on, and whose `failed` goes to the dead-letter queue and the group's alert.
   * Returns the sources of the result: the call's `out` and the retry's `ok`.
   */
  call(
    from: Src | Src[],
    step: string,
    title: string,
    subtitle: string,
    inType: string,
    outType = inType,
    run?: DemoRun,
    retryRun?: DemoRun,
  ): Src[] {
    // Reads and writes inside Odoo or D1 (`fetch`) fail rarely and are retried by the runtime:
    // only calls that leave (HTTP, mail, invoicing) get their own error path.
    if (step === "fetch") return [this.step(from, step, title, subtitle, inType, outType, run)];
    const id = this.node(
      step,
      title,
      subtitle,
      [{ id: "in", type: inType }],
      [
        { id: "out", type: outType },
        { id: "error", label: "error", type: "error" },
      ],
      run,
    );
    this.link(from, id);
    const retry = this.node(
      "http",
      `Retry: ${title[0]!.toLowerCase()}${title.slice(1)}`,
      "3 tries · 2 s, 8 s, 30 s",
      [{ id: "in", type: "error" }],
      [
        { id: "ok", label: "ok", type: outType },
        { id: "failed", label: "failed", type: "error" },
      ],
      retryRun,
    );
    this.link({ node: id, port: "error" }, retry);
    // One dead-letter queue and one alert per group: what the retries gave up on.
    if (!this.dead) {
      this.dead = this.node(
        "fetch",
        "Dead-letter the job",
        "D1 · o2c_dead_letters.insert()",
        [{ id: "in", type: "error" }],
        [{ id: "out", type: "error" }],
      );
      const alert = this.node(
        "chat",
        "Alert #o2c-alerts",
        `Teams · ${this.group?.label ?? "flow"} failures`,
        [{ id: "in", type: "error" }],
        [],
      );
      this.link({ node: this.dead, port: "out" }, alert);
    }
    this.link({ node: retry, port: "failed" }, this.dead);
    return [
      { node: id, port: "out" },
      { node: retry, port: "ok" },
    ];
  }

  /** A condition or a switch: one output per case, all of `type`. */
  branch(
    from: Src | Src[],
    title: string,
    subtitle: string,
    type: string,
    cases: string[] = ["true", "false"],
    run?: DemoRun,
  ): Record<string, Src> {
    const id = this.node(
      "if",
      title,
      subtitle,
      [{ id: "in", type }],
      cases.map((c) => ({ id: c, label: c, type })),
      run,
    );
    this.link(from, id);
    return Object.fromEntries(cases.map((c) => [c, { node: id, port: c }]));
  }

  approval(from: Src | Src[], title: string, subtitle: string, type: string, run?: DemoRun) {
    return this.branch(from, title, subtitle, type, ["approved", "rejected", "timeout"], run);
  }

  merge(from: Src[], title: string, type: string): Src {
    const id = this.node(
      "merge",
      title,
      "Merge · wait for all",
      [{ id: "in", type, multiple: true }],
      [{ id: "out", type }],
    );
    this.link(from, id);
    return { node: id, port: "out" };
  }

  /** A message: takes anything, passes it on. */
  notify(
    from: Src | Src[],
    step: "chat" | "mail",
    title: string,
    subtitle: string,
    run?: DemoRun,
  ): Src {
    return this.step(from, step, title, subtitle, "any", "any", run);
  }
}

/* ---------------------------------------------------------------- the flow */

const COUNTRIES = [
  { cc: "FR", name: "France", portal: "Chorus Pro", format: "Factur-X", lang: "fr-FR" },
  { cc: "DE", name: "Germany", portal: "ZRE (XRechnung)", format: "XRechnung", lang: "de-DE" },
  { cc: "IT", name: "Italy", portal: "SDI", format: "FatturaPA", lang: "it-IT" },
  { cc: "ES", name: "Spain", portal: "FACe", format: "Facturae", lang: "es-ES" },
  { cc: "BE", name: "Belgium", portal: "Mercurius (Peppol)", format: "Peppol BIS", lang: "fr-BE" },
  {
    cc: "NL",
    name: "Netherlands",
    portal: "Digipoort (Peppol)",
    format: "Peppol BIS",
    lang: "nl-NL",
  },
] as const;

/** The countries the demo run had orders for. */
const RUN_COUNTRIES = ["FR", "DE", "IT", "ES", "BE"];

export function orderToCash(): { graph: FlowGraph<DemoStep>; json: string; run: RunState } {
  const f = new FlowBuilder();

  /* -- Intake */
  f.begin("Intake");
  const confirmed = f.trigger(
    "webhook",
    "Order confirmed",
    "Odoo · sale.order → state = sale",
    "order",
  );
  const catchUp = f.trigger("schedule", "Every 15 min: catch-up", "Schedule · */15 * * * *", "any");
  const search = f.call(
    catchUp,
    "fetch",
    "Find uninvoiced orders",
    "Odoo · sale.order.search_read()",
    "any",
    "orders",
  );
  const split = f.step(
    search,
    "fetch",
    "Split into orders",
    "Items · one per order",
    "orders",
    "order",
  );
  const intake = f.merge([confirmed, split], "Merge order sources", "order");
  const dedupe = f.step(intake, "fetch", "Drop duplicates", "KV · seen order refs (24 h)", "order");
  const lines = f.call(
    dedupe,
    "fetch",
    "Load order lines",
    "Odoo · sale.order.line.read()",
    "order",
  );
  const partner = f.call(
    lines,
    "fetch",
    "Load customer",
    "Odoo · res.partner + fiscal position",
    "order",
  );
  const isEur = f.branch(
    partner,
    "Currency is EUR?",
    "If · order.currency = EUR",
    "order",
    undefined,
    {
      ports: ["true", "false"],
    },
  );
  const rate = f.call(
    isEur.false!,
    "http",
    "Fetch ECB rate",
    "HTTP · ecb.europa.eu/eurofxref",
    "order",
  );
  const inEur = f.merge([isEur.true!, ...rate], "Amounts in EUR", "order");
  const tagged = f.step(inEur, "fetch", "Tag the order", "Odoo · tag 'automation: o2c'", "order");
  const normalized = f.step(
    tagged,
    "fetch",
    "Write the audit trail",
    "D1 · o2c_audit.insert()",
    "order",
  );

  /* -- Validation */
  f.begin("Validation");
  const hasVat = f.branch(
    normalized,
    "Has a VAT number?",
    "If · partner.vat is set",
    "order",
    undefined,
    {
      ports: ["true", "false"],
    },
  );
  const vies = f.call(
    hasVat.true!,
    "http",
    "Check VAT on VIES",
    "HTTP · ec.europa.eu/taxation/vies",
    "order",
  );
  const viesOk = f.branch(vies, "VAT valid?", "If · vies.valid", "order", undefined, {
    ports: ["true"],
  });
  const b2c = f.step(
    hasVat.false!,
    "fetch",
    "Mark as B2C",
    "Odoo · fiscal position = B2C",
    "order",
  );
  const badVat = f.step(
    viesOk.false!,
    "task",
    "Ask sales admin to fix VAT",
    "Tasks · assign to sales admin",
    "order",
  );
  f.notify(badVat, "mail", "Email the sales rep", "Outlook · from billing@ shared mailbox");
  const waitFix = f.step(badVat, "wait", "Wait for the fix", "Wait · up to 2 days", "order");
  const address = f.branch(
    [viesOk.true!, b2c, waitFix],
    "Address complete?",
    "If · street, zip, city, country",
    "order",
    undefined,
    { ports: ["true"] },
  );
  const geocode = f.call(
    address.false!,
    "http",
    "Complete the address",
    "HTTP · api-adresse.data.gouv.fr",
    "order",
  );
  const valid = f.merge([address.true!, ...geocode], "Validated orders", "order");
  const products = f.call(
    valid,
    "fetch",
    "Check product taxes",
    "Odoo · account.tax per line",
    "order",
  );
  const stock = f.call(
    products,
    "fetch",
    "Check stock reservation",
    "Odoo · stock.picking state",
    "order",
  );
  const ready = f.branch(
    stock,
    "Delivered or service?",
    "If · picking done or no stock",
    "order",
    undefined,
    {
      ports: ["true"],
    },
  );
  const waitDelivery = f.step(
    ready.false!,
    "wait",
    "Wait for delivery",
    "Wait · until picking done",
    "order",
  );
  const toCredit = f.merge([ready.true!, waitDelivery], "Ready to invoice", "order");

  /* -- Credit & approvals */
  f.begin("Credit & approvals");
  const credit = f.call(
    toCredit,
    "fetch",
    "Read credit exposure",
    "Odoo · partner.credit + open orders",
    "order",
  );
  const over = f.branch(
    credit,
    "Over credit limit?",
    "If · exposure > credit_limit",
    "order",
    undefined,
    {
      ports: ["true", "false"],
    },
  );
  const tier = f.branch(
    over.true!,
    "Amount tier",
    "Switch · order.amount_total",
    "order",
    ["< 10k", "10k–50k", "> 50k"],
    { ports: ["< 10k", "10k–50k", "> 50k"] },
  );
  const mgr = f.approval(
    tier["< 10k"]!,
    "Sales manager approval",
    "Teams · adaptive card",
    "order",
    {
      ports: ["approved"],
    },
  );
  const dir = f.approval(
    tier["10k–50k"]!,
    "Finance director approval",
    "Teams · adaptive card",
    "order",
    {
      ports: ["timeout"],
    },
  );
  const remind = f.notify(
    dir.timeout!,
    "chat",
    "Remind the approver",
    "Teams · DM + escalate to deputy",
  );
  const dir2 = f.approval(remind, "Deputy approval", "Teams · adaptive card · 24 h", "order", {
    ports: ["approved"],
  });
  const cfo = f.approval(tier["> 50k"]!, "CFO approval", "Teams · adaptive card", "order", {
    ports: ["approved"],
  });
  const ceo = f.approval(cfo.approved!, "CEO approval", "Teams · adaptive card", "order", {
    ports: ["approved"],
  });
  const rejected = f.merge(
    [
      mgr.rejected!,
      dir.rejected!,
      dir2.rejected!,
      cfo.rejected!,
      ceo.rejected!,
      dir2.timeout!,
      mgr.timeout!,
      cfo.timeout!,
      ceo.timeout!,
    ],
    "Not approved",
    "order",
  );
  const hold = f.call(
    rejected,
    "fetch",
    "Put the order on hold",
    "Odoo · sale.order.action_hold()",
    "order",
  );
  f.notify(hold, "mail", "Tell the customer", "Outlook · template 'order on hold'");
  f.notify(hold, "chat", "Tell the account manager", "Teams · #sales-ops");
  const approved = f.merge(
    [over.false!, mgr.approved!, dir.approved!, dir2.approved!, ceo.approved!],
    "Approved orders",
    "order",
  );
  const prepay = f.branch(
    approved,
    "Prepayment terms?",
    "If · payment_term = immediate",
    "order",
    undefined,
    {
      ports: ["true", "false"],
    },
  );
  const link = f.call(
    prepay.true!,
    "http",
    "Create a payment link",
    "Stripe · checkout.sessions.create()",
    "order",
  );
  f.notify(link, "mail", "Send the payment link", "Outlook · template 'pay now'");
  const waitPay = f.step(
    link,
    "wait",
    "Wait for payment",
    "Wait · until Stripe webhook, 7 days",
    "order",
  );
  const toInvoice = f.merge([prepay.false!, waitPay], "Cleared to invoice", "order");

  /* -- Invoicing, one group per country */
  f.begin("Routing");
  const route = f.branch(
    toInvoice,
    "Route by company country",
    "Switch · company.country_id",
    "order",
    [...COUNTRIES.map((c) => c.cc), "other"],
    { ports: RUN_COUNTRIES },
  );
  const unsupported = f.step(
    route.other!,
    "task",
    "Manual invoicing",
    "Tasks · finance queue",
    "order",
  );
  f.notify(unsupported, "chat", "Flag unsupported country", "Teams · #finance");
  const issued: Src[] = [];
  for (const c of COUNTRIES) {
    f.begin(`Invoicing — ${c.name}`);
    const inRun = RUN_COUNTRIES.includes(c.cc);
    const fiscal = f.step(
      route[c.cc]!,
      "fetch",
      `Map fiscal position ${c.cc}`,
      `Odoo · account.fiscal.position (${c.cc})`,
      "order",
    );
    const pub = f.branch(
      fiscal,
      "Public sector buyer?",
      "If · partner.is_public_body",
      "order",
      undefined,
      {
        ports: c.cc === "IT" || c.cc === "FR" ? ["true", "false"] : ["false"],
      },
    );
    // Public sector: the e-invoicing portal.
    const xml = f.step(
      pub.true!,
      "invoice",
      `Build ${c.format}`,
      `Invoices · ${c.format} XML`,
      "order",
      "invoice",
    );
    const sign = f.call(xml, "http", "Sign the XML", "HTTP · qualified e-seal (HSM)", "invoice");
    const submit = f.call(
      sign,
      "http",
      `Submit to ${c.portal}`,
      `HTTP · ${c.portal} API`,
      "invoice",
      "invoice",
      // Italy: SDI answers 503 once, the retry gets through.
      c.cc === "IT" ? { status: "error", ports: ["error"] } : undefined,
      c.cc === "IT" ? { ports: ["ok"] } : undefined,
    );
    const receipt = f.call(
      submit,
      "fetch",
      "Store the receipt",
      "R2 · einvoice/{year}/{ref}.xml",
      "invoice",
    );
    const accepted = f.branch(
      receipt,
      "Accepted by the portal?",
      "If · portal status",
      "invoice",
      ["accepted", "rejected"],
      {
        ports: ["accepted"],
      },
    );
    const fix = f.step(
      accepted.rejected!,
      "task",
      "Fix the rejected invoice",
      "Tasks · finance, with portal reason",
      "invoice",
    );
    f.notify(fix, "chat", "Tell finance", `Teams · #finance-${c.cc.toLowerCase()}`);
    // Private sector: Odoo invoice, PDF, email.
    const draft = f.call(
      pub.false!,
      "invoice",
      "Create the invoice",
      "Odoo · account.move.create()",
      "order",
      "invoice",
    );
    const slip = f.step(
      draft,
      "fetch",
      "Attach the delivery slip",
      "Odoo · stock.picking report",
      "invoice",
    );
    const terms = f.step(
      slip,
      "fetch",
      "Apply payment terms",
      "Odoo · account.payment.term",
      "invoice",
    );
    const post = f.call(
      terms,
      "invoice",
      "Post the invoice",
      "Odoo · account.move.action_post()",
      "invoice",
    );
    const ref = f.step(
      post,
      "fetch",
      "Add the payment reference",
      "Odoo · structured ref + SEPA QR",
      "invoice",
    );
    const pdf = f.call(ref, "fetch", "Render the PDF", `Odoo · report (${c.lang})`, "invoice");
    const store = f.call(
      pdf,
      "fetch",
      "Archive the PDF",
      "R2 · invoices/{year}/{ref}.pdf",
      "invoice",
    );
    const mail = f.call(
      store,
      "mail",
      "Email the invoice",
      `Outlook · billing@ · ${c.lang}`,
      "invoice",
    );
    const big = f.branch(mail, "Over 50k?", "If · amount_total > 50,000", "invoice", undefined, {
      ports: c.cc === "DE" ? ["true", "false"] : ["false"],
    });
    // Germany: the Teams connector of #key-accounts expired; the message fails.
    const kam = f.notify(
      big.true!,
      "chat",
      "Tell the key account manager",
      "Teams · #key-accounts",
      c.cc === "DE" ? { status: "error" } : undefined,
    );
    const done = f.merge(
      [accepted.accepted!, big.false!, kam],
      `Invoice issued — ${c.cc}`,
      "invoice",
    );
    issued.push(done);
    void inRun;
  }

  /* -- Payments */
  f.begin("Payments");
  const allIssued = f.merge(issued, "All issued invoices", "invoice");
  const crm = f.call(
    allIssued,
    "fetch",
    "Log on the CRM",
    "Odoo · mail.message on the deal",
    "invoice",
  );
  f.notify(crm, "chat", "Post the daily tally", "Teams · #sales (once a day)");
  const stripe = f.trigger(
    "webhook",
    "Payment succeeded",
    "Stripe · payment_intent.succeeded",
    "payment",
  );
  const match = f.call(
    stripe,
    "fetch",
    "Find the invoice",
    "Odoo · account.move by payment ref",
    "payment",
  );
  const matched = f.branch(match, "Matched?", "If · one open invoice found", "payment", undefined, {
    ports: ["true", "false"],
  });
  const registered = f.call(
    matched.true!,
    "invoice",
    "Register the payment",
    "Odoo · account.payment.register",
    "payment",
  );
  const register = f.step(
    registered,
    "fetch",
    "Update the cash forecast",
    "D1 · cash_forecast.upsert()",
    "payment",
  );
  const full = f.branch(register, "Fully paid?", "If · amount_residual = 0", "payment", undefined, {
    ports: ["true"],
  });
  const paid = f.step(
    full.true!,
    "fetch",
    "Mark the order paid",
    "Odoo · sale.order invoice_status",
    "payment",
  );
  f.notify(paid, "mail", "Send the receipt", "Outlook · template 'thank you'");
  const partial = f.notify(
    full.false!,
    "mail",
    "Send a statement",
    "Outlook · template 'balance due'",
  );
  const unmatched = f.step(
    matched.false!,
    "task",
    "Queue unmatched payment",
    "Tasks · accountant review",
    "payment",
  );
  f.notify(unmatched, "chat", "Flag unmatched payment", "Teams · #finance");
  void partial;

  /* -- Dunning */
  f.begin("Dunning");
  const daily = f.trigger(
    "schedule",
    "Every day at 08:00: dunning",
    "Schedule · 0 8 * * 1-5",
    "any",
  );
  const overdue = f.call(
    daily,
    "fetch",
    "List overdue invoices",
    "Odoo · account.move due < today",
    "any",
    "invoices",
  );
  const each = f.step(
    overdue,
    "fetch",
    "Split into invoices",
    "Items · one per invoice",
    "invoices",
    "invoice",
  );
  const disputed = f.branch(each, "Disputed?", "If · invoice.dispute_flag", "invoice", undefined, {
    ports: ["false"],
  });
  f.step(
    disputed.true!,
    "task",
    "Leave to the account manager",
    "Tasks · dispute owner",
    "invoice",
  );
  const days = f.branch(
    disputed.false!,
    "Days overdue",
    "Switch · today − due date",
    "invoice",
    ["7", "15", "30", "60+"],
    { ports: ["7", "15", "30"] },
  );
  const l1 = f.call(
    days["7"]!,
    "mail",
    "Friendly reminder",
    "Outlook · template 'reminder 1'",
    "invoice",
  );
  const l2 = f.call(
    days["15"]!,
    "mail",
    "Second reminder",
    "Outlook · template 'reminder 2' + PDF",
    "invoice",
  );
  const l3 = f.call(
    days["30"]!,
    "mail",
    "Formal notice",
    "Outlook · template 'mise en demeure'",
    "invoice",
  );
  const call30 = f.step(
    l3,
    "task",
    "Call the customer",
    "Tasks · credit controller, today",
    "invoice",
  );
  const block = f.call(
    days["60+"]!,
    "fetch",
    "Block new orders",
    "Odoo · partner.sale_warn = block",
    "invoice",
  );
  const agency = f.call(
    block,
    "http",
    "Hand to collections",
    "HTTP · collections agency API",
    "invoice",
  );
  f.notify(agency, "chat", "Tell the account manager", "Teams · DM");
  const logged = f.merge([...l1, ...l2, call30, ...agency], "Dunning done", "invoice");
  f.call(logged, "fetch", "Log the dunning step", "Odoo · followup line + chatter", "invoice");

  /* -- Refunds (sub-flow) */
  f.begin("Refunds");
  const asked = f.trigger(
    "webhook",
    "Credit note requested",
    "Odoo · helpdesk ticket tag = refund",
    "refund",
  );
  const original = f.call(
    asked,
    "fetch",
    "Load the original invoice",
    "Odoo · account.move by origin",
    "refund",
  );
  const within = f.branch(
    original,
    "Within 30 days?",
    "If · today − invoice_date ≤ 30",
    "refund",
    undefined,
    {
      ports: ["true", "false"],
    },
  );
  const exception = f.approval(
    within.false!,
    "Approve late refund",
    "Teams · adaptive card · finance",
    "refund",
    {
      ports: ["approved"],
    },
  );
  f.notify(
    exception.rejected!,
    "mail",
    "Decline the refund",
    "Outlook · template 'refund declined'",
  );
  const size = f.branch(
    [within.true!, exception.approved!],
    "Over 1,000?",
    "If · amount > 1,000",
    "refund",
    undefined,
    { ports: ["false"] },
  );
  const big = f.approval(size.true!, "Finance approval", "Teams · adaptive card", "refund");
  const okRefund = f.merge([size.false!, big.approved!], "Refund approved", "refund");
  const credit_ = f.call(
    okRefund,
    "invoice",
    "Create the credit note",
    "Odoo · account.move.reversal",
    "refund",
  );
  const how = f.branch(
    credit_,
    "Refund method",
    "Switch · original payment",
    "refund",
    ["card", "transfer", "credit"],
    {
      ports: ["card"],
    },
  );
  const card = f.call(how.card!, "http", "Refund the card", "Stripe · refunds.create()", "refund");
  const sepa = f.call(
    how.transfer!,
    "http",
    "Prepare a SEPA transfer",
    "Bank · pain.001 batch",
    "refund",
  );
  const sepaOk = f.approval(sepa, "Second signature", "Bank · 4-eyes in the bank portal", "refund");
  const keep = f.step(
    how.credit!,
    "fetch",
    "Keep as customer credit",
    "Odoo · outstanding credit",
    "refund",
  );
  const refunded = f.merge([...card, sepaOk.approved!, keep], "Refund done", "refund");
  const rec = f.call(
    refunded,
    "invoice",
    "Reconcile the credit note",
    "Odoo · reconcile()",
    "refund",
  );
  f.notify(rec, "mail", "Confirm to the customer", "Outlook · template 'refund done'");
  f.call(rec, "fetch", "Close the ticket", "Odoo · helpdesk.ticket stage = solved", "refund");

  /* -- Reconciliation */
  f.begin("Reconciliation");
  const nightly = f.trigger("schedule", "Every night at 02:00", "Schedule · 0 2 * * *", "any");
  const feed = f.trigger("webhook", "New bank lines", "Bank feed · statement.created", "line");
  const fetchLines = f.call(
    nightly,
    "fetch",
    "Fetch statement lines",
    "Odoo · account.bank.statement.line",
    "any",
    "line",
  );
  const allLines = f.merge([feed, ...fetchLines], "Unreconciled lines", "line");
  const rule = f.branch(
    allLines,
    "Matching rule",
    "Switch · first rule that fits",
    "line",
    ["exact ref", "amount + partner", "fuzzy", "none"],
    { ports: ["exact ref", "amount + partner", "fuzzy", "none"] },
  );
  const exact = f.call(
    rule["exact ref"]!,
    "invoice",
    "Reconcile by reference",
    "Odoo · reconcile()",
    "line",
  );
  const amount = f.call(
    rule["amount + partner"]!,
    "invoice",
    "Reconcile by amount",
    "Odoo · reconcile() + check",
    "line",
  );
  const fuzzy = f.call(rule.fuzzy!, "http", "Score candidates", "HTTP · matching service", "line");
  const sure = f.branch(fuzzy, "Score ≥ 0.9?", "If · best.score ≥ 0.9", "line");
  const fuzzyOk = f.call(
    sure.true!,
    "invoice",
    "Reconcile the best match",
    "Odoo · reconcile()",
    "line",
  );
  const diff = f.branch(
    [...exact, ...amount, ...fuzzyOk],
    "Difference under 1 €?",
    "If · |residual| < 1",
    "line",
    undefined,
    { ports: ["true"] },
  );
  const writeOff = f.call(
    diff.true!,
    "invoice",
    "Write off the cents",
    "Odoo · account 658/758",
    "line",
  );
  const suspense = f.call(
    [rule.none!, sure.false!, diff.false!],
    "invoice",
    "Post to suspense",
    "Odoo · account 471",
    "line",
  );
  const review = f.step(
    suspense,
    "task",
    "Accountant review",
    "Tasks · reconciliation queue",
    "line",
  );
  const reconciled = f.merge([...writeOff, review], "Reconciled lines", "line");
  const total = f.step(
    reconciled,
    "fetch",
    "Sum what is left",
    "D1 · unreconciled by company",
    "line",
  );
  const high = f.branch(total, "Over 5,000 left?", "If · total > 5,000", "line", undefined, {
    ports: ["false"],
  });
  f.notify(high.true!, "chat", "Alert finance", "Teams · #finance");
  for (const c of COUNTRIES) {
    f.call(high.false!, "fetch", `Close the day — ${c.cc}`, `Odoo · lock date (${c.name})`, "line");
  }

  /* -- Reporting */
  f.begin("Reporting");
  const weekly = f.trigger("schedule", "Monday 07:00: AR report", "Schedule · 0 7 * * 1", "any");
  const queries = [
    ["AR aging", "Odoo · account.aged.receivable"],
    ["DSO by country", "D1 · invoices ⨝ payments"],
    ["Invoices this week", "Odoo · account.move.read_group"],
    ["Refunds this week", "Odoo · reversals"],
    ["Dunning outcomes", "D1 · dunning_log"],
    ["Approvals waiting", "D1 · approvals where state = open"],
  ] as const;
  const results = queries.flatMap(([title, sub]) =>
    f.call(weekly, "fetch", title, sub, "any", "report"),
  );
  const merged = f.merge(results, "All figures", "report");
  const workbook = f.call(
    merged,
    "http",
    "Build the workbook",
    "Graph · Excel workbook from template",
    "report",
  );
  const upload = f.call(
    workbook,
    "http",
    "Upload to SharePoint",
    "Graph · /Finance/AR/{week}.xlsx",
    "report",
  );
  const summary = f.step(
    upload,
    "fetch",
    "Write the summary",
    "Template · 5 key figures",
    "report",
  );
  f.notify(summary, "chat", "Post to #finance", "Teams · #finance with the link");
  f.notify(summary, "mail", "Email the CFO", "Outlook · CFO digest");
  f.call(summary, "fetch", "Save the metrics", "D1 · ar_weekly.insert()", "report");

  const graph = applyLayout(f.graph, layoutGraph(f.graph, { layerGap: 60 }));
  const frames = planRun(graph, demoOutcome);
  return { graph, json: JSON.stringify(graph), run: frames.at(-1)! };
}
