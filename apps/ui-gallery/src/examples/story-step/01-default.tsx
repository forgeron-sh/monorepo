import { DeployIcon, GitForkIcon, RollbackIcon } from "@forgeron/icons";
import { SoonTag, StoryList, StoryStep } from "@forgeron/ui";

export default function Default() {
  return (
    <StoryList>
      <StoryStep
        n="01"
        label="Step 1"
        title="Start from a tool that already works."
        text="A CRM, a help desk, a notes app: browse finished tools and install one."
        points={[
          { icon: DeployIcon, text: "Installed in one click" },
          { icon: RollbackIcon, text: "Kept up to date by its maintainers" },
          { icon: GitForkIcon, text: "Yours to fork" },
        ]}
      >
        <span className="text-eyebrow">
          The catalog
          <SoonTag />
        </span>
      </StoryStep>
    </StoryList>
  );
}
