/**
 * Build a space-separated className string from strings and boolean maps.
 *
 * Usage examples:
 * classNames('btn', { 'btn-primary': isPrimary, 'disabled': !enabled })
 * classNames('flex items-center', undefined, { hidden: !show })
 */
export type ClassNameMap = Record<string, boolean | null | undefined>;
export type ClassNameArg = string | ClassNameMap | null | undefined | false;

export function classNames(...args: ClassNameArg[]): string {
  const classList: string[] = [];

  for (const arg of args) {
    if (typeof arg === "string") {
      const trimmed = arg.trim();
      if (trimmed) classList.push(trimmed);
      continue;
    }

    if (arg && typeof arg === "object") {
      for (const [className, enabled] of Object.entries(arg)) {
        if (enabled) classList.push(className);
      }
    }
  }

  return classList.join(" ");
}
