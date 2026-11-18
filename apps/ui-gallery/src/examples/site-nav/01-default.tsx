import { SiteNav } from "@forgeron/ui";

export default function Default() {
  return (
    <SiteNav
      github="https://github.com/forgeron-sh/monorepo"
      start="#start"
      current="/pricing"
      links={[
        { href: "#how", label: "How it works" },
        { href: "#host", label: "Hosting" },
        { href: "/pricing", label: "Pricing" },
      ]}
    />
  );
}
