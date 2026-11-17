/**
 * The savings simulator's catalog: tools a team pays for per seat today, grouped by what Forgeron's
 * catalog covers. Every price was read on the vendor's official pricing page on 2026-11-17, in USD
 * (the page given in `source`); tools priced only in euros there (Odoo, Pipedrive, Retool) or whose
 * page did not settle the billing period (HubSpot) are left out rather than guessed.
 *
 * Logos: the brand marks of `@forgeron/icons`, in pixels (the marks stay their owners'
 * trademarks, used here only to name the tools). A tool without one gets its initial.
 */

import {
  type PixelIcon,
  AirtableIcon,
  AsanaIcon,
  AttioIcon,
  ConfluenceIcon,
  IntercomIcon,
  JiraIcon,
  LinearIcon,
  Notion01Icon,
  SalesforceIcon,
  ZendeskIcon,
} from "@forgeron/icons";

/** When the price was read. */
export const READ_ON = "2026-11-17";

/** Forgeron Cloud's price per seat per month, as on the plans (`plans.ts`). */
export const FORGERON_SEAT = 14.99;

export interface StackTool {
  id: string;
  name: string;
  /** The plan the price is for. */
  plan: string;
  /** Monthly cost for `seats` people, in USD. */
  cost: (seats: number) => number;
  /** How the price reads on the vendor's page. */
  note: string;
  source: string;
  /** Its brand mark, or absent for its initial. */
  icon?: PixelIcon;
}

export interface StackGroup {
  name: string;
  tools: StackTool[];
}

const perSeat = (price: number) => (seats: number) => price * seats;

export const stack: StackGroup[] = [
  {
    name: "Projects",
    tools: [
      {
        id: "linear",
        name: "Linear",
        plan: "Basic",
        cost: perSeat(10),
        note: "$10 per seat per month, billed yearly",
        icon: LinearIcon,
        source: "https://linear.app/pricing",
      },
      {
        id: "jira",
        name: "Jira",
        plan: "Standard",
        cost: perSeat(9.7),
        note: "$9.70 per user per month, billed monthly, up to 100 users",
        icon: JiraIcon,
        source: "https://www.atlassian.com/software/jira/pricing",
      },
      {
        id: "asana",
        name: "Asana",
        plan: "Starter",
        cost: perSeat(10.99),
        note: "$10.99 per seat per month, billed yearly",
        icon: AsanaIcon,
        source: "https://asana.com/pricing",
      },
    ],
  },
  {
    name: "Docs and notes",
    tools: [
      {
        id: "notion",
        name: "Notion",
        plan: "Plus",
        cost: perSeat(10),
        note: "$10 per seat per month, billed yearly",
        icon: Notion01Icon,
        source: "https://www.notion.com/pricing",
      },
      {
        id: "confluence",
        name: "Confluence",
        plan: "Standard",
        cost: perSeat(7.15),
        note: "$7.15 per user per month, billed monthly, up to 100 users",
        icon: ConfluenceIcon,
        source: "https://www.atlassian.com/software/confluence/pricing",
      },
    ],
  },
  {
    name: "CRM",
    tools: [
      {
        id: "attio",
        name: "Attio",
        plan: "Plus",
        cost: (seats) => (seats > 0 ? 40 + 35 * (seats - 1) : 0),
        note: "$40 per workspace with one user, then $35 per user, per month, billed yearly",
        icon: AttioIcon,
        source: "https://attio.com/pricing/usd",
      },
      {
        id: "salesforce",
        name: "Salesforce",
        plan: "Pro Suite",
        cost: perSeat(100),
        note: "$100 per user per month, billed yearly",
        icon: SalesforceIcon,
        source: "https://www.salesforce.com/sales/pricing/",
      },
    ],
  },
  {
    name: "Help desk",
    tools: [
      {
        id: "zendesk",
        name: "Zendesk",
        plan: "Suite Team",
        cost: perSeat(55),
        note: "$55 per agent per month, billed yearly",
        icon: ZendeskIcon,
        source: "https://www.zendesk.com/pricing/",
      },
      {
        id: "intercom",
        name: "Intercom",
        plan: "Essential",
        cost: perSeat(29),
        note: "$29 per seat per month, billed yearly, before the new-customer discount",
        icon: IntercomIcon,
        source: "https://www.intercom.com/pricing",
      },
      {
        id: "freshdesk",
        name: "Freshdesk",
        plan: "Growth",
        cost: perSeat(19),
        note: "$19 per agent per month, billed yearly",
        source: "https://www.freshworks.com/freshdesk/pricing/",
      },
    ],
  },
  {
    name: "Internal tools",
    tools: [
      {
        id: "airtable",
        name: "Airtable",
        plan: "Team",
        cost: perSeat(20),
        note: "$20 per seat per month, billed yearly",
        icon: AirtableIcon,
        source: "https://www.airtable.com/pricing",
      },
    ],
  },
];
