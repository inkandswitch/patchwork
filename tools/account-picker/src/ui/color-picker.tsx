import { createSignal, createEffect, For, Show } from "solid-js";
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
}

export function ColorPicker(props: ColorPickerProps) {
  const [showCustom, setShowCustom] = createSignal(false);
  const [customHue, setCustomHue] = createSignal(200);
  const [customSat, setCustomSat] = createSignal(70);
  const [customLight, setCustomLight] = createSignal(50);

  createEffect(() => {
    if (props.value) {
      const parsed = parseHslColor(props.value);
      if (parsed) {
        setCustomHue(parsed.h);
        setCustomSat(parsed.s);
        setCustomLight(parsed.l);
      }
    }
  });

  createEffect(() => {
    if (showCustom()) {
      const color = createHslColor(customHue(), customSat(), customLight());
      props.onChange(color);
    }
  });

  return (
    <div class="color-picker">
      <Label>Color</Label>

      <div class="color-grid">
        <For each={[...USER_COLOR_PALETTE]}>
          {(color) => (
            <button
              type="button"
              class={`color-swatch${props.value === color.value ? " selected" : ""}`}
              style={{ "background-color": color.value }}
              onClick={() => {
                setShowCustom(false);
                props.onChange(color.value);
              }}
              title={color.name}
            >
              <Show when={props.value === color.value}>
                <svg
                  class="icon-check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </Show>
            </button>
          )}
        </For>
      </div>

      <button
        type="button"
        class="color-custom-toggle"
        onClick={() => setShowCustom(!showCustom())}
      >
        {showCustom() ? "Hide" : "Show"} custom color
      </button>

      <Show when={showCustom()}>
        <div class="color-custom-panel">
          <div class="color-custom-row">
            <div
              class="color-preview"
              style={{
                "background-color": createHslColor(
                  customHue(),
                  customSat(),
                  customLight()
                ),
              }}
            />
            <div class="color-sliders">
              <div class="color-slider-row">
                <Label class="xs">Hue</Label>
                <Input
                  type="range"
                  min="0"
                  max="360"
                  value={customHue()}
                  onInput={(e) => setCustomHue(Number(e.currentTarget.value))}
                  class="range"
                />
                <span class="color-slider-value">{customHue()}°</span>
              </div>
              <div class="color-slider-row">
                <Label class="xs">Saturation</Label>
                <Input
                  type="range"
                  min="0"
                  max="100"
                  value={customSat()}
                  onInput={(e) => setCustomSat(Number(e.currentTarget.value))}
                  class="range"
                />
                <span class="color-slider-value">{customSat()}%</span>
              </div>
              <div class="color-slider-row">
                <Label class="xs">Lightness</Label>
                <Input
                  type="range"
                  min="20"
                  max="80"
                  value={customLight()}
                  onInput={(e) => setCustomLight(Number(e.currentTarget.value))}
                  class="range"
                />
                <span class="color-slider-value">{customLight()}%</span>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
