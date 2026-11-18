import { CloudflareIcon, CloudIcon, Settings01Icon } from "@forgeron/icons";
import { PlanCard, PlanGrid } from "@forgeron/ui";

export default function Default() {
  return (
    <PlanGrid>
      <PlanCard
        featured
        name="Cloud"
        icon={CloudIcon}
        where="We run the platform for you."
        price="$14.99"
        unit="per seat, per month"
        groups={[{ title: "Operations", items: ["Updates applied for you", "Priority support"] }]}
        action={{ href: "#start", label: "Get started", primary: true, marker: true }}
      />
      <PlanCard
        name="Self-managed"
        icon={CloudflareIcon}
        where="On your own Cloudflare account."
        price="$0"
        unit="free"
        groups={[{ title: "Control", items: ["Your data stays in your account"] }]}
        action={{ href: "#guide", label: "Read the guide" }}
      />
      <PlanCard
        name="Own servers"
        icon={Settings01Icon}
        tag="Soon"
        where="On your own machines."
        groups={[{ title: "Control", items: ["Everything in your hands"] }]}
        action={{ href: "#news", label: "Follow it" }}
      />
    </PlanGrid>
  );
}
