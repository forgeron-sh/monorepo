/**
 * The savings simulator's catalog: tools a team pays for per seat today, grouped by what Forgeron's
 * catalog covers. Every price was read on the vendor's official pricing page on 2026-11-17, in USD
 * (the page given in `source`); tools priced only in euros there (Odoo, Pipedrive, Retool) or whose
 * page did not settle the billing period (HubSpot) are left out rather than guessed.
 *
 * Logos: paths from Simple Icons 16.36.0 (CC0; https://simpleicons.org). The marks stay their
 * owners' trademarks, used here only to name the tools. Tools without a Simple Icons logo get a
 * monogram.
 */

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
  /** A Simple Icons path in a 24 × 24 box, or absent for a monogram. */
  path?: string;
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
        source: "https://linear.app/pricing",
        path: "M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z",
      },
      {
        id: "jira",
        name: "Jira",
        plan: "Standard",
        cost: perSeat(9.7),
        note: "$9.70 per user per month, billed monthly, up to 100 users",
        source: "https://www.atlassian.com/software/jira/pricing",
        path: "M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0Z",
      },
      {
        id: "asana",
        name: "Asana",
        plan: "Starter",
        cost: perSeat(10.99),
        note: "$10.99 per seat per month, billed yearly",
        source: "https://asana.com/pricing",
        path: "M18.78 12.653c-2.882 0-5.22 2.336-5.22 5.22s2.338 5.22 5.22 5.22 5.22-2.34 5.22-5.22-2.336-5.22-5.22-5.22zm-13.56 0c-2.88 0-5.22 2.337-5.22 5.22s2.338 5.22 5.22 5.22 5.22-2.338 5.22-5.22-2.336-5.22-5.22-5.22zm12-6.525c0 2.883-2.337 5.22-5.22 5.22-2.882 0-5.22-2.337-5.22-5.22 0-2.88 2.338-5.22 5.22-5.22 2.883 0 5.22 2.34 5.22 5.22z",
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
        source: "https://www.notion.com/pricing",
        path: "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z",
      },
      {
        id: "confluence",
        name: "Confluence",
        plan: "Standard",
        cost: perSeat(7.15),
        note: "$7.15 per user per month, billed monthly, up to 100 users",
        source: "https://www.atlassian.com/software/confluence/pricing",
        path: "M.87 18.257c-.248.382-.53.875-.763 1.245a.764.764 0 0 0 .255 1.04l4.965 3.054a.764.764 0 0 0 1.058-.26c.199-.332.454-.763.733-1.221 1.967-3.247 3.945-2.853 7.508-1.146l4.957 2.337a.764.764 0 0 0 1.028-.382l2.364-5.346a.764.764 0 0 0-.382-1 599.851 599.851 0 0 1-4.965-2.361C10.911 10.97 5.224 11.185.87 18.257zM23.131 5.743c.249-.405.531-.875.764-1.25a.764.764 0 0 0-.256-1.034L18.675.404a.764.764 0 0 0-1.058.26c-.195.335-.451.763-.734 1.225-1.966 3.246-3.945 2.85-7.508 1.146L4.437.694a.764.764 0 0 0-1.027.382L1.046 6.422a.764.764 0 0 0 .382 1c1.039.49 3.105 1.467 4.965 2.361 6.698 3.246 12.392 3.029 16.738-4.04z",
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
        source: "https://attio.com/pricing/usd",
      },
      {
        id: "salesforce",
        name: "Salesforce",
        plan: "Pro Suite",
        cost: perSeat(100),
        note: "$100 per user per month, billed yearly",
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
        source: "https://www.zendesk.com/pricing/",
        path: "M12.914 2.904V16.29L24 2.905H12.914zM0 2.906C0 5.966 2.483 8.45 5.543 8.45s5.542-2.484 5.543-5.544H0zm11.086 4.807L0 21.096h11.086V7.713zm7.37 7.84c-3.063 0-5.542 2.48-5.542 5.543H24c0-3.06-2.48-5.543-5.543-5.543z",
      },
      {
        id: "intercom",
        name: "Intercom",
        plan: "Essential",
        cost: perSeat(29),
        note: "$29 per seat per month, billed yearly, before the new-customer discount",
        source: "https://www.intercom.com/pricing",
        path: "M21 0H3C1.343 0 0 1.343 0 3v18c0 1.658 1.343 3 3 3h18c1.658 0 3-1.342 3-3V3c0-1.657-1.342-3-3-3zm-5.801 4.399c0-.44.36-.8.802-.8.44 0 .8.36.8.8v10.688c0 .442-.36.801-.8.801-.443 0-.802-.359-.802-.801V4.399zM11.2 3.994c0-.44.357-.799.8-.799s.8.359.8.799v11.602c0 .44-.357.8-.8.8s-.8-.36-.8-.8V3.994zm-4 .405c0-.44.359-.8.799-.8.443 0 .802.36.802.8v10.688c0 .442-.36.801-.802.801-.44 0-.799-.359-.799-.801V4.399zM3.199 6c0-.442.36-.8.802-.8.44 0 .799.358.799.8v7.195c0 .441-.359.8-.799.8-.443 0-.802-.36-.802-.8V6zM20.52 18.202c-.123.105-3.086 2.593-8.52 2.593-5.433 0-8.397-2.486-8.521-2.593-.335-.288-.375-.792-.086-1.128.285-.334.79-.375 1.125-.09.047.041 2.693 2.211 7.481 2.211 4.848 0 7.456-2.186 7.479-2.207.334-.289.839-.25 1.128.086.289.336.25.84-.086 1.128zm.281-5.007c0 .441-.36.8-.801.8-.441 0-.801-.36-.801-.8V6c0-.442.361-.8.801-.8.441 0 .801.357.801.8v7.195z",
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
        source: "https://www.airtable.com/pricing",
        path: "M11.992 1.966c-.434 0-.87.086-1.28.257L1.779 5.917c-.503.208-.49.908.012 1.116l8.982 3.558a3.266 3.266 0 0 0 2.454 0l8.982-3.558c.503-.196.503-.908.012-1.116l-8.957-3.694a3.255 3.255 0 0 0-1.272-.257zM23.4 8.056a.589.589 0 0 0-.222.045l-10.012 3.877a.612.612 0 0 0-.38.564v8.896a.6.6 0 0 0 .821.552L23.62 18.1a.583.583 0 0 0 .38-.551V8.653a.6.6 0 0 0-.6-.596zM.676 8.095a.644.644 0 0 0-.48.19C.086 8.396 0 8.53 0 8.69v8.355c0 .442.515.737.908.54l6.27-3.006.307-.147 2.969-1.436c.466-.22.43-.908-.061-1.092L.883 8.138a.57.57 0 0 0-.207-.044z",
      },
    ],
  },
];
