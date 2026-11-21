import {
  DateRangeCompare,
  DateRangeCompareCustom,
  DateRangeComparePeriod,
  DateRangeCompareSelect,
  DateRangeCompareSummary,
  DateRangeCompareVs,
} from "@forgeron/ui";

// Your own order and your own words: the summary first, no custom period.
export default function Default() {
  return (
    <DateRangeCompare
      today="2026-11-18"
      defaultValue={{ range: { from: "2026-11-01", to: "2026-11-30" }, compare: "previous-year" }}
      compareOptions={["none", "previous-period", "previous-year"]}
    >
      <DateRangeComparePeriod />
      <DateRangeCompareVs>against</DateRangeCompareVs>
      <DateRangeCompareSelect />
      <DateRangeCompareCustom />
      <DateRangeCompareSummary />
    </DateRangeCompare>
  );
}
