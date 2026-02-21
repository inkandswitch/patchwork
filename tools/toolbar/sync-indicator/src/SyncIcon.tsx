interface SyncIconProps {
  size?: number;
  class?: string;
  alert?: boolean;
}

export function SyncIcon(props: SyncIconProps) {
  const s = () => props.size ?? 20;

  return (
    <svg
      width={s()}
      height={s()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={props.class ?? ""}
    >
      <path d="M17 2l3 3-3 3" />
      <path d="M3 11V9a4 4 0 0 1 4-4h13" />
      <path d="M7 22l-3-3 3-3" />
      <path d="M21 13v2a4 4 0 0 1-4 4H4" />
      {props.alert && (
        <>
          <line x1="12" y1="9" x2="12" y2="13" stroke-width="2.5" />
          <circle cx="12" cy="15.5" r="0.5" fill="currentColor" stroke-width="1.5" />
        </>
      )}
    </svg>
  );
}
