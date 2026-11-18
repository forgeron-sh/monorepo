import { GithubIcon } from "@forgeron/icons";
import { SiteFooter } from "@forgeron/ui";

const github = "https://github.com/forgeron-sh/monorepo";

// Without the hearth's script, the wordmark is the static pixel drawing in cold iron.
export default function Default() {
  return (
    <SiteFooter
      from="/0.9"
      columns={[
        {
          title: "Product",
          links: [
            { href: "#how", label: "How it works" },
            { href: "#pricing", label: "Pricing" },
          ],
        },
        { title: "Developers", links: [{ href: "#docs", label: "Docs" }] },
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
