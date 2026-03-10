export interface DateHeaderProps {
  date: Date;
}

/**
 * Component to display a date header in the timeline
 * Groups history items by day
 */
export function DateHeader(props: DateHeaderProps) {
  const dayOfWeek = () => {
    return props.date.toLocaleDateString(undefined, { weekday: "long" });
  };

  const formattedDate = () => {
    return props.date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Check if this date is today
  const isToday = () => {
    const today = new Date();
    return (
      props.date.getDate() === today.getDate() &&
      props.date.getMonth() === today.getMonth() &&
      props.date.getFullYear() === today.getFullYear()
    );
  };

  // Check if this date is yesterday
  const isYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      props.date.getDate() === yesterday.getDate() &&
      props.date.getMonth() === yesterday.getMonth() &&
      props.date.getFullYear() === yesterday.getFullYear()
    );
  };

  const displayDay = () => {
    if (isToday()) return "Today";
    if (isYesterday()) return "Yesterday";
    return dayOfWeek();
  };

  return (
    <div class="sticky top-0 z-10 bg-base-100 py-2 px-3 mb-2">
      <div class="flex items-baseline gap-2">
        <div class="text-sm font-semibold text-base-content">
          {displayDay()}
        </div>
        <div class="text-xs text-base-content/60">{formattedDate()}</div>
      </div>
      <div class="mt-1 h-px bg-base-300/50"></div>
    </div>
  );
}
