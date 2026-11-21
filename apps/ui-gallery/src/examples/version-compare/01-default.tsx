import {
  VersionCompare,
  VersionCompareItem,
  VersionCompareList,
  VersionCompareView,
  type CompareVersion,
} from "@forgeron/ui";

const versions: CompareVersion[] = [
  { id: "v3", label: "v3", at: "Nov 18, 10:20", by: "Léa Martin", content: "Budget: 12 000 EUR" },
  { id: "v2", label: "v2", at: "Nov 14, 16:02", by: "Hugo Bernard", content: "Budget: 10 000 EUR" },
  { id: "v1", label: "v1", at: "Nov 9, 09:41", by: "Hugo Bernard", content: "Budget: to define" },
];

export default function Composed() {
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <VersionCompare defaultFrom="v2" defaultTo="v3" onRestore={() => {}}>
        <VersionCompareList versions={versions}>
          {versions.map((v, i) => (
            <VersionCompareItem key={v.id} version={v} current={i === 0} />
          ))}
        </VersionCompareList>
        <VersionCompareView versions={versions} />
      </VersionCompare>
    </div>
  );
}
