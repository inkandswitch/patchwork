import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "./utils";
import {
  USER_COLOR_PALETTE,
  createHslColor,
  parseHslColor,
} from "./userColors";
import { Label } from "./label";
import { Input } from "./input";

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [showCustom, setShowCustom] = React.useState(false);
  const [customHue, setCustomHue] = React.useState(200);
  const [customSat, setCustomSat] = React.useState(70);
  const [customLight, setCustomLight] = React.useState(50);

  React.useEffect(() => {
    if (value) {
      const parsed = parseHslColor(value);
      if (parsed) {
        setCustomHue(parsed.h);
        setCustomSat(parsed.s);
        setCustomLight(parsed.l);
      }
    }
  }, [value]);

  const handleCustomColorChange = React.useCallback(() => {
    const color = createHslColor(customHue, customSat, customLight);
    onChange(color);
  }, [customHue, customSat, customLight, onChange]);

  React.useEffect(() => {
    if (showCustom) {
      handleCustomColorChange();
    }
  }, [showCustom, handleCustomColorChange]);

  return (
    <div className={cn("space-y-3", className)}>
      <Label>Color</Label>

      {/* Preset color grid */}
      <div className="grid grid-cols-6 gap-2">
        {USER_COLOR_PALETTE.map((color) => (
          <button
            key={color.value}
            type="button"
            className={cn(
              "w-10 h-10 rounded-md border-2 transition-all hover:scale-110",
              value === color.value
                ? "border-gray-900 dark:border-gray-100 ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100"
                : "border-gray-300 dark:border-gray-600"
            )}
            style={{ backgroundColor: color.value }}
            onClick={() => {
              setShowCustom(false);
              onChange(color.value);
            }}
            title={color.name}
          >
            {value === color.value && (
              <Check
                className="w-5 h-5 mx-auto text-white drop-shadow-lg"
                strokeWidth={3}
              />
            )}
          </button>
        ))}
      </div>

      {/* Custom color toggle */}
      <button
        type="button"
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline"
        onClick={() => setShowCustom(!showCustom)}
      >
        {showCustom ? "Hide" : "Show"} custom color
      </button>

      {/* Custom color sliders */}
      {showCustom && (
        <div className="space-y-3 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-md border-2 border-gray-300 dark:border-gray-600"
              style={{
                backgroundColor: createHslColor(
                  customHue,
                  customSat,
                  customLight
                ),
              }}
            />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs">Hue</Label>
                <Input
                  type="range"
                  min="0"
                  max="360"
                  value={customHue}
                  onChange={(e) => setCustomHue(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{customHue}°</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs">Saturation</Label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={customSat}
                  onChange={(e) => setCustomSat(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{customSat}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-20 text-xs">Lightness</Label>
                <Input
                  type="range"
                  min="20"
                  max="80"
                  value={customLight}
                  onChange={(e) => setCustomLight(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xs w-8 text-right">{customLight}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
