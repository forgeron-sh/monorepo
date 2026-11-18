import { ChartIcon, LockIcon, LogIcon } from "@forgeron/icons";
import { ArtCard, CardGrid } from "@forgeron/ui";

export default function Default() {
  return (
    <CardGrid artHeight={160}>
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
  );
}
