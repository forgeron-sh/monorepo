/**
 * Usage on Forgeron Cloud, for the pricing page: one balance per workspace, in US dollars, that
 * every use draws on, AI models and compute alike. Compute rates are the owner's (17 Nov 2026), rounded; AI rates are the
 * providers' list prices, read on 17 Nov 2026 (sources below).
 */
import {
  AnthropicIcon,
  BoltIcon,
  BookOpen01Icon,
  ChartIcon,
  CpuIcon,
  DatabaseIcon,
  GlobeIcon,
  LogIcon,
  Mail01Icon,
  MistralIcon,
  OpenaiIcon,
} from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";

/** The name of the workspace's balance in dollars (owner's choice, 17 Nov 2026). */
export const BALANCE = "Fuel";

/** When the AI providers' prices were read. */
export const AI_READ_ON = "17 Nov 2026";

export interface AiModel {
  provider: string;
  icon: IconDefinition;
  model: string;
  /** US dollars per million tokens. */
  input: number;
  output: number;
  cacheRead: number;
  /** The shortest-lived cache write the provider lists; null when it lists none. */
  cacheWrite: number | null;
}

export const aiSources = [
  { provider: "Anthropic", url: "https://platform.claude.com/docs/en/about-claude/pricing" },
  { provider: "OpenAI", url: "https://developers.openai.com/api/docs/pricing" },
  { provider: "Mistral", url: "https://docs.mistral.ai/inference/pricing" },
];

export const aiModels: AiModel[] = [
  {
    provider: "Anthropic",
    icon: AnthropicIcon,
    model: "Claude Opus 5.5",
    input: 4,
    output: 20,
    cacheRead: 0.2,
    cacheWrite: 5,
  },
  {
    provider: "Anthropic",
    icon: AnthropicIcon,
    model: "Claude Sonnet 5.5",
    input: 2,
    output: 10,
    cacheRead: 0.1,
    cacheWrite: 2.5,
  },
  {
    provider: "Anthropic",
    icon: AnthropicIcon,
    model: "Claude Haiku 5.5",
    input: 0.1,
    output: 0.5,
    cacheRead: 0.01,
    cacheWrite: 0.125,
  },
  {
    provider: "OpenAI",
    icon: OpenaiIcon,
    model: "gpt-6-astra",
    input: 10,
    output: 50,
    cacheRead: 1,
    cacheWrite: 12.5,
  },
  {
    provider: "OpenAI",
    icon: OpenaiIcon,
    model: "gpt-6.1-sol",
    input: 2,
    output: 10,
    cacheRead: 0.1,
    cacheWrite: 2.5,
  },
  {
    provider: "OpenAI",
    icon: OpenaiIcon,
    model: "gpt-6-luna",
    input: 0.1,
    output: 0.5,
    cacheRead: 0.01,
    cacheWrite: 0.125,
  },
  {
    provider: "Mistral",
    icon: MistralIcon,
    model: "Mistral Large 4",
    input: 0.7,
    output: 2.1,
    cacheRead: 0.07,
    cacheWrite: null,
  },
  {
    provider: "Mistral",
    icon: MistralIcon,
    model: "Mistral Small 4",
    input: 0.15,
    output: 0.6,
    cacheRead: 0.015,
    cacheWrite: null,
  },
];

/** A compute meter: what a tool uses, its unit, and its price in US dollars per unit. */
interface Meter {
  key: string;
  name: string;
  unit: string;
  usd: number;
}

export interface MeterGroup {
  resource: string;
  /** The resource's icon, as in the home page's resource list. */
  icon: IconDefinition;
  meters: Meter[];
}

export const meterGroups: MeterGroup[] = [
  {
    resource: "Running the tool",
    icon: CpuIcon,
    meters: [
      { key: "requests", name: "Requests", unit: "per million", usd: 0.4 },
      { key: "cpu", name: "CPU time", unit: "per CPU hour", usd: 0.09 },
    ],
  },
  {
    resource: "Database",
    icon: DatabaseIcon,
    meters: [
      { key: "rowsRead", name: "Rows read", unit: "per billion", usd: 1.3 },
      { key: "rowsWritten", name: "Rows written", unit: "per million", usd: 1.3 },
      { key: "dbStorage", name: "Storage", unit: "per GB-month", usd: 0.95 },
    ],
  },
  {
    resource: "Files",
    icon: BookOpen01Icon,
    meters: [
      { key: "fileStorage", name: "Storage", unit: "per GB-month", usd: 0.019 },
      { key: "fileWrites", name: "Uploads and lists", unit: "per million", usd: 6 },
      { key: "fileReads", name: "Reads", unit: "per million", usd: 0.45 },
      { key: "egress", name: "Downloads", unit: "per GB", usd: 0 },
    ],
  },
  {
    resource: "Cache",
    icon: BoltIcon,
    meters: [
      { key: "cacheReads", name: "Reads", unit: "per million", usd: 0.65 },
      { key: "cacheWrites", name: "Writes and deletes", unit: "per million", usd: 6.5 },
      { key: "cacheStorage", name: "Storage", unit: "per GB-month", usd: 0.65 },
    ],
  },
  {
    resource: "Realtime",
    icon: GlobeIcon,
    meters: [
      { key: "messages", name: "Messages", unit: "per million", usd: 0.19 },
      { key: "roomHours", name: "Open channels", unit: "per thousand hours", usd: 7.2 },
    ],
  },
  {
    resource: "Queue",
    icon: LogIcon,
    meters: [{ key: "queueOps", name: "Operations", unit: "per million", usd: 0.5 }],
  },
  {
    resource: "Mail",
    icon: Mail01Icon,
    meters: [
      { key: "mailSent", name: "Sent", unit: "per thousand", usd: 0.45 },
      { key: "mailReceived", name: "Received", unit: "per thousand", usd: 0 },
    ],
  },
  {
    resource: "Observability",
    icon: ChartIcon,
    meters: [{ key: "logs", name: "Log events", unit: "per million", usd: 0.75 }],
  },
];

const rate = Object.fromEntries(meterGroups.flatMap((g) => g.meters.map((m) => [m.key, m.usd])));

/** A month of usage: each line a quantity in the meter's own unit (millions, GB…). */
export interface Scenario {
  name: string;
  text: string;
  lines: { label: string; key: string; qty: number }[];
}

export const scenarios: Scenario[] = [
  {
    name: "A CRM for 30 people",
    text: "Contacts, deals and follow-up mail, used every day.",
    lines: [
      { label: "600,000 requests", key: "requests", qty: 0.6 },
      { label: "3 CPU hours", key: "cpu", qty: 3 },
      { label: "30 million rows read", key: "rowsRead", qty: 0.03 },
      { label: "300,000 rows written", key: "rowsWritten", qty: 0.3 },
      { label: "2 GB of database", key: "dbStorage", qty: 2 },
      { label: "2 million cache reads", key: "cacheReads", qty: 2 },
      { label: "4,000 mails sent", key: "mailSent", qty: 4 },
    ],
  },
  {
    name: "One person, a heavy files month",
    text: "Someone moves a whole archive into the shared drive.",
    lines: [
      { label: "200 GB stored", key: "fileStorage", qty: 200 },
      { label: "80,000 uploads", key: "fileWrites", qty: 0.08 },
      { label: "1.5 million reads", key: "fileReads", qty: 1.5 },
      { label: "400 GB downloaded", key: "egress", qty: 400 },
    ],
  },
  {
    name: "A live support desk",
    text: "Fifteen agents on shared queues, all day, mail in and out.",
    lines: [
      { label: "2,500 hours of open channels", key: "roomHours", qty: 2.5 },
      { label: "3 million live messages", key: "messages", qty: 3 },
      { label: "500,000 queue operations", key: "queueOps", qty: 0.5 },
      { label: "20,000 mails received", key: "mailReceived", qty: 20 },
      { label: "2,000 mails sent", key: "mailSent", qty: 2 },
      { label: "5 million log events", key: "logs", qty: 5 },
    ],
  },
];

/** The cost of a line, and of a scenario, in US dollars. */
export const lineCost = (l: { key: string; qty: number }) => l.qty * (rate[l.key] ?? 0);
export const scenarioCost = (s: Scenario) => s.lines.reduce((sum, l) => sum + lineCost(l), 0);

/** The AI example: the same month of support replies on two models. */
export const aiExample = {
  text: "3,000 support replies, each reading 6,000 tokens (4,000 of them a cached prompt) and writing 600.",
  usage: { input: 6, cached: 12, output: 1.8 },
  models: ["Claude Sonnet 5.5", "Claude Haiku 5.5"],
};
export const aiCost = (m: AiModel, u = aiExample.usage) =>
  u.input * m.input + u.cached * m.cacheRead + u.output * m.output;

/** A unit price in dollars: whole dollars bare, otherwise at least the cents ($0.40, $0.019). */
export const fmt = (n: number) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 3,
  });

/** An amount in dollars, to the cent. */
export const money = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
