import {
  ColorPickerClear,
  ColorPickerContent,
  ColorPickerInput,
  ColorPickerPanel,
  ColorPickerRoot,
  ColorPickerSwatch,
  ColorPickerSwatches,
  ColorPickerTrigger,
} from "@forgeron/ui";

// The popup in parts: a short palette of your own, the hex field and the remove button.
export default function Composed() {
  return (
    <ColorPickerRoot label="Tag colour" columns={3} defaultValue="#ffb020">
      <ColorPickerTrigger />
      <ColorPickerContent>
        <ColorPickerPanel>
          <ColorPickerSwatches>
            <ColorPickerSwatch value="#ff4f1f" label="Ember" />
            <ColorPickerSwatch value="#ffb020" label="Amber" />
            <ColorPickerSwatch value="#3ddc84" label="Green" />
          </ColorPickerSwatches>
          <ColorPickerInput />
          <ColorPickerClear />
        </ColorPickerPanel>
      </ColorPickerContent>
    </ColorPickerRoot>
  );
}
