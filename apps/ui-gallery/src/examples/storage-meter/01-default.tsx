import {
  StorageMeter,
  StorageMeterBar,
  StorageMeterHead,
  StorageMeterLegend,
  StorageMeterTotal,
} from "@forgeron/ui";

export default function Composed() {
  return (
    <div style={{ width: 240 }}>
      <StorageMeter
        quota={100e9}
        parts={[
          { label: "My files", bytes: 8.4e9 },
          { label: "Team drives", bytes: 31.2e9 },
          { label: "App files", bytes: 4.1e9 },
        ]}
      >
        <StorageMeterHead />
        <StorageMeterBar />
        <StorageMeterTotal />
        <StorageMeterLegend />
      </StorageMeter>
    </div>
  );
}
