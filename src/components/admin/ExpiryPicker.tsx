import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MAX_EXPIRY_HOURS, MIN_EXPIRY_HOURS } from "@/lib/admin-api/fields";

const PRESETS = [
  { hours: 1, label: "1 hour" },
  { hours: 24, label: "24 hours" },
  { hours: 168, label: "7 days" },
  { hours: 720, label: "30 days" },
];

const CUSTOM = "custom";

interface ExpiryPickerProps {
  /** Hours; NaN while the custom field is empty or not a number. */
  value: number;
  onChange: (hours: number) => void;
  disabled?: boolean;
  error?: string;
}

/** 
 * Link lifetime: a few presets plus a custom number of hours (1-720). 
 * @param value The current expiry value in hours.
 * @param onChange Callback when the expiry value changes.
 * @param disabled Whether the picker is disabled.
 * @param error Error message to display.
 */
const ExpiryPicker = ({ value, onChange, disabled, error }: ExpiryPickerProps) => {
  const [custom, setCustom] = useState(() => !PRESETS.some((preset) => preset.hours === value));
  const selected = custom ? CUSTOM : String(value);

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="mb-3 text-sm font-medium leading-none">Link expiry</legend>
      <ToggleGroup
        type="single"
        variant="outline"
        value={selected}
        // Radix reports "" when the active item is pressed again; keep the current choice instead.
        onValueChange={(next) => {
          if (!next) return;
          if (next === CUSTOM) {
            setCustom(true);
            return;
          }
          setCustom(false);
          onChange(Number(next));
        }}
        className="flex flex-wrap justify-start gap-2"
      >
        {PRESETS.map((preset) => (
          <ToggleGroupItem
            key={preset.hours}
            value={String(preset.hours)}
            className="rounded-full data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          >
            {preset.label}
          </ToggleGroupItem>
        ))}
        <ToggleGroupItem
          value={CUSTOM}
          className="rounded-full data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
        >
          Custom
        </ToggleGroupItem>
      </ToggleGroup>

      {custom && (
        <div className="max-w-xs space-y-2">
          <Label htmlFor="expiry-hours">Hours ({MIN_EXPIRY_HOURS}-{MAX_EXPIRY_HOURS})</Label>
          <Input
            id="expiry-hours"
            type="number"
            inputMode="numeric"
            min={MIN_EXPIRY_HOURS}
            max={MAX_EXPIRY_HOURS}
            step={1}
            value={Number.isNaN(value) ? "" : value}
            onChange={(event) => onChange(event.target.value === "" ? Number.NaN : Number(event.target.value))}
          />
        </div>
      )}

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </fieldset>
  );
};

export default ExpiryPicker;
