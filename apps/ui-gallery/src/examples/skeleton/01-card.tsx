import { Skeleton, SkeletonGroup, SkeletonText } from "@forgeron/ui";

export default function Card() {
  return (
    <div style={{ width: 320 }}>
      <SkeletonGroup label="Loading the contact">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Skeleton width={40} height={40} />
          <Skeleton width="50%" />
        </div>
        <SkeletonText lines={3} />
      </SkeletonGroup>
    </div>
  );
}
