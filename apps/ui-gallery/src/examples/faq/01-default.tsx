import { Faq } from "@forgeron/ui";

export default function Default() {
  return (
    <Faq
      items={[
        { q: "What is a tool?", a: "A business application your team uses: a CRM, a help desk." },
        { q: "Do I need servers?", a: "No. Each tool runs as its own Cloudflare Worker." },
        { q: "Is it open source?", a: "Yes, under the Apache-2.0 license." },
      ]}
    />
  );
}
