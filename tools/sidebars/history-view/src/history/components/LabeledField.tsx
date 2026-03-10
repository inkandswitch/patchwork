import type { JSXElement } from "solid-js";

export interface LabeledFieldProps {
  label: string;
  children: JSXElement;
}

/**
 * Renders a labeled field with a small uppercase label and content below.
 */
export function LabeledField(props: LabeledFieldProps) {
  return (
    <div class="mb-2">
      <div class="text-[11px] font-medium text-base-content/50 uppercase tracking-wide mb-0.5">
        {props.label}
      </div>
      <div class="text-sm text-base-content">{props.children}</div>
    </div>
  );
}
