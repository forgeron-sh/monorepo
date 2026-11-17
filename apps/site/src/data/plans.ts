/**
 * The three ways to run Forgeron, shared by the home page (without prices) and the pricing page.
 * Prices are the owner's (17 Nov 2026); a seat is a person who called a tool that month (D-024).
 */
import { CloudflareIcon, CloudIcon, Settings01Icon } from "@forgeron/icons";
import type { IconDefinition } from "@forgeron/icons";

/** The public repository. */
export const GITHUB = "https://github.com/forgeron-sh/monorepo";

export interface Plan {
  name: string;
  icon: IconDefinition;
  /** The iso scene drawn on top of the plan. */
  iso: string;
  tag: string;
  price: string;
  unit: string;
  where: string;
  groups: { title: string; items: string[] }[];
  action: { label: string; href: string; primary: boolean };
}

/** The self-host guide, in the repository. */
export const SELF_HOST = "https://github.com/forgeron-sh/monorepo/blob/main/docs/self-host.md";

export const plans: Plan[] = [
  {
    name: "Forgeron Cloud",
    icon: CloudIcon,
    iso: "host-cloud",
    tag: "",
    price: "$14.99",
    unit: "per seat, per month",
    where: "We run the platform for you, on our Cloudflare account.",
    groups: [
      {
        title: "Operations",
        items: [
          "Updates applied for you",
          "Security patches applied for you",
          "Resources provisioned for you",
        ],
      },
      {
        title: "Support and billing",
        items: ["Priority support", "One bill for the workspace, per seat"],
      },
    ],
    action: { label: "Get started", href: "#start", primary: true },
  },
  {
    name: "Self-managed",
    icon: CloudflareIcon,
    iso: "host-self",
    tag: "",
    price: "$0",
    unit: "free, Cloudflare bills you directly",
    where: "The same platform, installed on your own Cloudflare account.",
    groups: [
      {
        title: "Operations",
        items: [
          "Installed and updated with the forgeron CLI",
          "You provision resources and apply patches",
        ],
      },
      {
        title: "Control",
        items: [
          "You see the Workers, databases and logs",
          "Your data stays in your account",
          "Support through GitHub",
        ],
      },
    ],
    action: { label: "Read the install guide", href: SELF_HOST, primary: false },
  },
  {
    name: "Your own servers",
    icon: Settings01Icon,
    iso: "host-servers",
    tag: "Soon",
    price: "$0",
    unit: "free and open source",
    where: "The platform on a machine or a VPS you run, without Cloudflare.",
    groups: [
      {
        title: "Operations",
        items: ["No Cloudflare account needed", "The same tools and interfaces"],
      },
      {
        title: "Trade-offs",
        items: ["Less redundancy than Cloudflare's network", "Fewer usage features"],
      },
    ],
    action: { label: "Follow on GitHub", href: GITHUB, primary: false },
  },
];
