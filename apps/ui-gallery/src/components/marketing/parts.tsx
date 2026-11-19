import type { ReactNode } from "react";
import {
  AnvilIcon,
  ChartIcon,
  CloudflareIcon,
  CloudIcon,
  DeployIcon,
  GitForkIcon,
  GithubIcon,
  LockIcon,
  LogIcon,
  RollbackIcon,
  Settings01Icon,
} from "@forgeron/icons";
import {
  ArtCard,
  Bento,
  BentoCell,
  CardGrid,
  CompareTable,
  CtaBand,
  Faq,
  FigureGrid,
  Hero,
  LogoStrip,
  LogoTile,
  MarkBadge,
  PixelFigure,
  PlanCard,
  PlanGrid,
  SectionHead,
  SiteFooter,
  SiteNav,
  SoonTag,
  StoryList,
  StoryStep,
  Stepper,
} from "@forgeron/ui";

// The six marketing blocks of forgeron.sh, each one on its own: navigation, hero, story, showcase,
// pricing, closing. Landing.tsx puts them together top to bottom; the Marketing pages show each one
// alone. The drawings of the site (isometric scenes, shaders) are left to dotted fields.

const github = "https://github.com/forgeron-sh/monorepo";

// A pixel Y on an ember square, as the badge above the title.
const mark = (
  <svg viewBox="0 0 9 11" shapeRendering="crispEdges" aria-hidden="true">
    <rect width="9" height="11" style={{ fill: "var(--accent)" }} />
    <path
      style={{ fill: "var(--accent-ink)" }}
      d="M2 2h1v1h-1zM6 2h1v1h-1zM2 3h1v1h-1zM6 3h1v1h-1zM3 4h1v1h-1zM5 4h1v1h-1zM4 5h1v4h-1z"
    />
  </svg>
);

/** A placeholder for a drawing: a dotted field with a word in the middle. */
function Art({ children }: { children?: ReactNode }) {
  return <div className="landing-art fg-dots">{children}</div>;
}

const steps = [
  {
    n: "01",
    title: "Start from a tool that already works.",
    text: "A CRM, a help desk, a notes app: browse finished tools and install one.",
    points: [
      { icon: DeployIcon, text: "Installed in one click" },
      { icon: RollbackIcon, text: "Kept up to date by its maintainers" },
      { icon: GitForkIcon, text: "Yours to fork" },
    ],
    art: (
      <span className="text-eyebrow">
        The catalog <SoonTag />
      </span>
    ),
  },
  {
    n: "02",
    title: "Shape it to your team with AI.",
    text: "Ask for the field, the view or the rule you miss; review the change like any other.",
    points: [
      { icon: GitForkIcon, text: "A branch per change" },
      { icon: LogIcon, text: "A preview to try it" },
    ],
    art: <span className="text-eyebrow">The change</span>,
  },
  {
    n: "03",
    title: "Ship it to your people and your agents.",
    text: "The web, the API, the terminal and Claude, behind your company's sign-in.",
    points: [
      { icon: LockIcon, text: "Company SSO" },
      { icon: CloudflareIcon, text: "On Cloudflare Workers" },
    ],
    art: <span className="text-eyebrow">The release</span>,
  },
];

/* 1 · Navigation: the bar at the top and the footer at the bottom. */

export function NavigationTop() {
  return (
    <SiteNav
      github={github}
      start="#l-start"
      links={[
        { href: "#l-how", label: "How it works" },
        { href: "#l-access", label: "Access" },
        { href: "#l-host", label: "Hosting" },
        { href: "#l-extras", label: "Extras" },
        { href: "#l-faq", label: "FAQ" },
      ]}
    />
  );
}

export function NavigationBottom() {
  return (
    <SiteFooter
      from="/0.6"
      columns={[
        {
          title: "Product",
          links: [
            { href: "#l-how", label: "How it works" },
            { href: "#l-host", label: "Hosting" },
          ],
        },
        { title: "Developers", links: [{ href: "#l-faq", label: "Docs" }] },
        {
          title: "Open source",
          links: [
            { href: github, label: "GitHub", icon: GithubIcon },
            { href: github, label: "License · Apache-2.0" },
          ],
        },
      ]}
      legal={["Open source · Apache-2.0", "Runs on Cloudflare Workers", "forgeron.sh"]}
    />
  );
}

/* 2 · Hero: the top of the page and the names under it. */

export function HeroBlock() {
  return (
    <div className="fg-rail">
      <Hero
        badge={<MarkBadge mark={mark}>Not backed by Y Combinator</MarkBadge>}
        title={["Forge your", "internal tools."]}
        proof={[
          { icon: CloudflareIcon, text: "Cloudflare" },
          { icon: AnvilIcon, text: "Apache-2.0" },
          { icon: LockIcon, text: "Company SSO" },
        ]}
        lead="Pick a ready-made tool. Shape it to your team with AI. Ship it to your people and your agents."
        command="npx forgeron init"
        action={{ href: "#l-start", label: "Get started" }}
      />
      <LogoStrip label="Forging at" names={["Acme"]} slots={4} />
    </div>
  );
}

/* 3 · Story: numbered steps, Pick, Shape, Ship. */

export function StoryBlock() {
  return (
    <section id="l-how" className="fg-rail">
      <SectionHead
        index="/0.1"
        title={["Pick. Shape.", "Ship."]}
        lead="From a tool that already works to a tool that fits your team."
      />
      <StoryList>
        {steps.map((s, i) => (
          <StoryStep
            key={s.n}
            n={s.n}
            label={`Step ${i + 1}`}
            title={s.title}
            text={s.text}
            points={s.points}
          >
            {s.art}
          </StoryStep>
        ))}
      </StoryList>
    </section>
  );
}

/* 4 · Showcase: cards, figures and a bento of small features. */

export function ShowcaseCards() {
  return (
    <section id="l-access" className="fg-rail">
      <SectionHead
        index="/0.2"
        title={["Who uses it,", "and how much."]}
        lead="Sign-in, measures and a log of every change, on every tool at once."
      />
      <CardGrid artHeight={200}>
        <ArtCard
          icon={LockIcon}
          title="Company SSO"
          text="Your teams sign in with the provider you use."
        />
        <ArtCard
          icon={ChartIcon}
          title="Every call, measured"
          text="Calls, time per call, errors and logs."
        />
        <ArtCard icon={LogIcon} title="Audit log" text="Usage, deployments and every change." />
      </CardGrid>
    </section>
  );
}

export function ShowcaseFigures() {
  return (
    <section className="fg-rail">
      <SectionHead
        index="/0.3"
        title={["Close to", "everyone."]}
        lead="Each tool runs as its own Worker, on Cloudflare's network."
      />
      <FigureGrid
        figures={[
          { n: "348", label: "cities in the network" },
          { n: "50MS", label: "from 95% of Internet users" },
          { n: "13K+", label: "network interconnections" },
          { n: "0", label: "cold starts, on V8 isolates" },
        ]}
      />
    </section>
  );
}

export function ShowcaseBento() {
  return (
    <section id="l-extras" className="fg-rail">
      <SectionHead index="/0.5" title={["The small", "extras."]} />
      <Bento>
        <BentoCell
          span={2}
          rows={2}
          title="Usage per team"
          text="One unit for everything a tool runs."
          art={
            <Art>
              <Stepper label="People on the team" value={10} />
            </Art>
          }
        />
        <BentoCell
          span={2}
          rows={2}
          corner={<SoonTag />}
          title="One AI gateway"
          text="Every model behind one entry, and who calls what."
          art={
            <Art>
              <PixelFigure text="1" label="One gateway" />
            </Art>
          }
        />
        <BentoCell
          span={2}
          rows={2}
          title="Marketplaces"
          text="Add a GitHub repository of your team's tools as a private catalog."
          art={
            <Art>
              <span className="landing-tiles">
                <LogoTile icon={GithubIcon} />
                <LogoTile icon={CloudflareIcon} />
                <LogoTile name="Acme" />
              </span>
            </Art>
          }
        />
      </Bento>
    </section>
  );
}

/* 5 · Pricing: the plans and what separates them. */

export function PricingBlock() {
  return (
    <section id="l-host" className="fg-rail">
      <SectionHead
        index="/0.4"
        title={["Our cloud,", "or yours."]}
        lead="The same platform in every case. Only who runs it changes."
      />
      <PlanGrid>
        <PlanCard
          featured
          name="Cloud"
          icon={CloudIcon}
          where="We run the platform for you."
          price="$14.99"
          unit="per seat, per month"
          groups={[{ title: "Operations", items: ["Updates applied for you", "Priority support"] }]}
          action={{ href: "#l-start", label: "Get started", primary: true, marker: true }}
        />
        <PlanCard
          name="Self-managed"
          icon={CloudflareIcon}
          where="On your own Cloudflare account."
          price="$0"
          unit="free"
          groups={[{ title: "Control", items: ["Your data stays in your account"] }]}
          action={{ href: "#l-start", label: "Read the guide" }}
        />
        <PlanCard
          name="Own servers"
          icon={Settings01Icon}
          tag="Soon"
          where="On your own machines."
          groups={[{ title: "Control", items: ["Everything in your hands"] }]}
          action={{ href: "#l-faq", label: "Follow it" }}
        />
      </PlanGrid>
      <CompareTable
        label="Plans compared"
        columns={[
          { name: "Cloud", icon: CloudIcon },
          { name: "Self-managed", icon: CloudflareIcon },
          { name: "Own servers", icon: Settings01Icon },
        ]}
        groups={[
          {
            group: "Running it",
            rows: [
              { name: "Cloudflare's network", v: [true, true, false] },
              { name: "Updates applied for you", v: [true, false, false] },
              { name: "Recipes and plugins", v: ["Soon", "Soon", "Soon"] },
            ],
          },
          {
            group: "Price",
            rows: [{ name: "Per seat, per month", v: ["$14.99", "$0", "$0"] }],
          },
        ]}
      />
    </section>
  );
}

/* 6 · Closing: the questions, then the last call to action. */

export function ClosingFaq() {
  return (
    <section id="l-faq" className="fg-rail">
      <SectionHead index="/0.6" title={["Questions,", "answered."]} meta="3 questions" />
      <Faq
        items={[
          { q: "What is a tool?", a: "A business application your team uses: a CRM, a help desk." },
          { q: "Do I need servers?", a: "No. Each tool runs as its own Cloudflare Worker." },
          { q: "Is it open source?", a: "Yes, under the Apache-2.0 license." },
        ]}
      />
    </section>
  );
}

export function ClosingCta() {
  return (
    <CtaBand
      id="l-start"
      title={["Forge your", "first tool."]}
      lead="Pick it, shape it, ship it. Open source, Apache-2.0."
      action={{ href: "#l-start", label: "Get started" }}
      command="npx forgeron init"
    >
      <div className="fg-dots" style={{ position: "absolute", inset: 0 }} />
    </CtaBand>
  );
}
