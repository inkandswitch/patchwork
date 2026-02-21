import type { JSX } from "solid-js";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost";
  size?: "default" | "sm";
}

const baseStyles =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variantStyles = {
  default: "bg-gray-900 text-white hover:bg-gray-700",
  ghost: "hover:bg-gray-100 hover:text-gray-900",
};

const sizeStyles = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3 text-xs",
};

export function Button(props: ButtonProps) {
  const variant = () => props.variant ?? "default";
  const size = () => props.size ?? "default";

  return (
    <button
      {...props}
      class={`${baseStyles} ${variantStyles[variant()]} ${sizeStyles[size()]} ${props.class ?? ""}`}
    >
      {props.children}
    </button>
  );
}
