import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * TODO: establish a system for referencing styles that are shared across multiple tools.
 * This palette is also defined in the account-picker.
 *
 * User color palette for presence indicators (cursors, avatars, etc.)
 *
 * Colors are selected to:
 * - Be easily distinguishable from each other
 * - Work well on both light and dark backgrounds
 * - Be accessible and readable
 * - Look professional and modern
 */
export const USER_COLOR_PALETTE = [
  { name: "Sky Blue", value: "hsl(200, 70%, 50%)" },
  { name: "Coral", value: "hsl(10, 75%, 58%)" },
  { name: "Emerald", value: "hsl(145, 70%, 45%)" },
  { name: "Violet", value: "hsl(270, 70%, 55%)" },
  { name: "Amber", value: "hsl(38, 85%, 50%)" },
  { name: "Rose", value: "hsl(350, 70%, 55%)" },
  { name: "Teal", value: "hsl(178, 70%, 45%)" },
  { name: "Indigo", value: "hsl(235, 70%, 58%)" },
  { name: "Lime", value: "hsl(85, 70%, 45%)" },
  { name: "Fuchsia", value: "hsl(310, 70%, 55%)" },
  { name: "Orange", value: "hsl(25, 80%, 52%)" },
  { name: "Cyan", value: "hsl(188, 75%, 48%)" },
] as const;

/**
 * Generate a deterministic color from a string (like userId)
 * Useful for fallback when user hasn't chosen a color
 */
export function generateColorFromString(str: string): string {
  const hash = Math.abs(
    str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  );
  const colorIndex = hash % USER_COLOR_PALETTE.length;
  return USER_COLOR_PALETTE[colorIndex].value;
}
