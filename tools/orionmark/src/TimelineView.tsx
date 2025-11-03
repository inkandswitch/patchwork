import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { MarkwhenEvent, MarkwhenDate, Duration } from "./markwhen.ts";

// ============================================================================
// Types & Constants
// ============================================================================

const ROW_HEIGHT = 50;
const ROW_PADDING = 10;

// Zoom levels: pixels per day
// Min: 1 year fits in ~1200px viewport = 365 days / 1200px ≈ 0.3px per day
// Max: 1 day fits in ~1200px viewport = 1200px per day
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 1200;

// ============================================================================
// Date Math Utilities
// ============================================================================

function dateToTimestamp(date: MarkwhenDate): number {
  const year = date.year;
  const month = (date.month || 1) - 1; // 0-indexed for Date
  const day = date.day || 1;
  return new Date(year, month, day).getTime();
}

function addDuration(start: MarkwhenDate, duration: Duration): number {
  const startTime = dateToTimestamp(start);
  const date = new Date(startTime);

  switch (duration.unit) {
    case "day":
      date.setDate(date.getDate() + duration.amount);
      break;
    case "week":
      date.setDate(date.getDate() + duration.amount * 7);
      break;
    case "month":
      date.setMonth(date.getMonth() + duration.amount);
      break;
    case "year":
      date.setFullYear(date.getFullYear() + duration.amount);
      break;
  }

  return date.getTime();
}

function getEventTimeRange(event: MarkwhenEvent): {
  start: number;
  end: number;
} {
  const start = dateToTimestamp(event.start);

  if (!event.end) {
    // Single date - show as a point (1 day span for visibility)
    return { start, end: start + 24 * 60 * 60 * 1000 };
  }

  if ("granularity" in event.end) {
    // End is a date
    return { start, end: dateToTimestamp(event.end) };
  } else {
    // End is a duration
    return { start, end: addDuration(event.start, event.end) };
  }
}

// ============================================================================
// Layout Utilities
// ============================================================================

function layoutEvents(
  events: MarkwhenEvent[]
): Array<{ event: MarkwhenEvent; row: number }> {
  const positioned: Array<{
    event: MarkwhenEvent;
    row: number;
    start: number;
    end: number;
  }> = [];

  for (const event of events) {
    const { start, end } = getEventTimeRange(event);

    // Find first available row
    let row = 0;
    while (true) {
      const conflict = positioned.find(
        (p) => p.row === row && !(end <= p.start || start >= p.end)
      );

      if (!conflict) break;
      row++;
    }

    positioned.push({ event, row, start, end });
  }

  return positioned;
}

// ============================================================================
// Main Component
// ============================================================================

interface TimelineViewProps {
  events: MarkwhenEvent[];
}

export function TimelineView({ events }: TimelineViewProps) {
  // Zoom is pixels per day, starts at showing ~3 months in 1200px viewport
  const [zoom, setZoom] = useState<number>(13);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(1200);

  // Calculate time bounds
  const { minTime, maxTime } = useMemo(() => {
    if (events.length === 0) {
      const now = Date.now();
      return { minTime: now, maxTime: now + 365 * 24 * 60 * 60 * 1000 };
    }

    let min = Infinity;
    let max = -Infinity;

    for (const event of events) {
      const { start, end } = getEventTimeRange(event);
      min = Math.min(min, start);
      max = Math.max(max, end);
    }

    // Add padding (at least 10% or 1 month)
    const padding = Math.max((max - min) * 0.1, 30 * 24 * 60 * 60 * 1000);
    return { minTime: min - padding, maxTime: max + padding };
  }, [events]);

  const positioned = useMemo(() => layoutEvents(events), [events]);
  const maxRow = Math.max(0, ...positioned.map((p) => p.row));

  // Track viewport width for zoom calculations
  useEffect(() => {
    const updateWidth = () => {
      if (scrollContainerRef.current) {
        setViewportWidth(scrollContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const msPerDay = 24 * 60 * 60 * 1000;
  const pixelsPerMs = zoom / msPerDay;
  const timelineWidth = Math.max(
    (maxTime - minTime) * pixelsPerMs,
    viewportWidth
  );
  const timelineHeight = Math.max((maxRow + 1) * ROW_HEIGHT + 100, 200);

  const timeToX = useCallback(
    (time: number) => (time - minTime) * pixelsPerMs,
    [minTime, pixelsPerMs]
  );

  const now = Date.now();
  const currentTimeX = timeToX(now);

  const handleFit = () => {
    if (
      scrollContainerRef.current &&
      events.length > 0 &&
      positioned.length > 0
    ) {
      // Calculate the time span needed to show all events
      const timeSpan = maxTime - minTime;
      const daysSpan = timeSpan / msPerDay;

      // Calculate zoom level to fit all events in viewport (with some padding)
      const targetZoom = Math.max(
        MIN_ZOOM,
        Math.min(MAX_ZOOM, (viewportWidth * 0.9) / daysSpan)
      );
      setZoom(targetZoom);

      // After zoom change, scroll to show first event
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const firstEvent = positioned[0];
          if (firstEvent) {
            const { start } = getEventTimeRange(firstEvent.event);
            const newPixelsPerMs = targetZoom / msPerDay;
            const x = (start - minTime) * newPixelsPerMs;
            scrollContainerRef.current.scrollLeft = Math.max(0, x - 50);
          }
        }
      }, 0);
    }
  };

  const handleJumpToNow = () => {
    if (scrollContainerRef.current) {
      const x = timeToX(now);
      scrollContainerRef.current.scrollLeft = Math.max(0, x - 200);
    }
  };

  // Generate time markers based on zoom level
  const timeMarkers = useMemo(() => {
    const markers: Array<{ x: number; label: string; major: boolean }> = [];
    const startDate = new Date(minTime);
    const endDate = new Date(maxTime);

    let current: Date;
    let increment: (d: Date) => void;
    let labelFormat: (d: Date) => string;

    // Determine granularity based on zoom level (pixels per day)
    if (zoom > 300) {
      // Very zoomed in: show every 12 hours
      current = new Date(startDate);
      current.setHours(0, 0, 0, 0);
      increment = (d) => d.setHours(d.getHours() + 12);
      labelFormat = (d) => {
        const hours = d.getHours();
        return hours === 0
          ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : `${hours}:00`;
      };
    } else if (zoom > 50) {
      // Zoomed in: show every day
      current = new Date(startDate);
      current.setHours(0, 0, 0, 0);
      increment = (d) => d.setDate(d.getDate() + 1);
      labelFormat = (d) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else if (zoom > 5) {
      // Medium zoom: show every week
      current = new Date(startDate);
      current.setHours(0, 0, 0, 0);
      const day = current.getDay();
      current.setDate(current.getDate() - (day === 0 ? 6 : day - 1));
      increment = (d) => d.setDate(d.getDate() + 7);
      labelFormat = (d) =>
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } else {
      // Zoomed out: show every month
      current = new Date(startDate);
      current.setDate(1);
      current.setHours(0, 0, 0, 0);
      increment = (d) => d.setMonth(d.getMonth() + 1);
      labelFormat = (d) =>
        d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
    }

    while (current <= endDate) {
      const x = timeToX(current.getTime());
      const isMajor =
        zoom <= 5
          ? current.getMonth() === 0
          : zoom <= 50
            ? current.getDate() === 1
            : current.getHours() === 0;

      markers.push({
        x,
        label: labelFormat(current),
        major: isMajor,
      });

      increment(current);
    }

    return markers;
  }, [minTime, maxTime, zoom, timeToX]);

  // Auto-fit on first render
  useEffect(() => {
    if (
      scrollContainerRef.current &&
      events.length > 0 &&
      positioned.length > 0
    ) {
      const firstEvent = positioned[0];
      const { start } = getEventTimeRange(firstEvent.event);
      const x = timeToX(start);
      scrollContainerRef.current.scrollLeft = Math.max(0, x - 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-color)",
        color: "var(--text-color)",
      }}
    >
      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "12px 16px",
          alignItems: "center",
          background: "var(--bg-color)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-color)",
          }}
        >
          Zoom:
        </span>
        <input
          type="range"
          min={Math.log(MIN_ZOOM)}
          max={Math.log(MAX_ZOOM)}
          step={0.01}
          value={Math.log(zoom)}
          onChange={(e) => {
            const newZoom = Math.exp(parseFloat(e.target.value));

            // Zoom in/out from center of viewport
            if (scrollContainerRef.current) {
              const container = scrollContainerRef.current;
              const centerX = container.scrollLeft + container.clientWidth / 2;
              const centerTime = minTime + centerX / pixelsPerMs;

              // Apply new zoom
              setZoom(newZoom);

              // After zoom change, adjust scroll to keep center point stable
              setTimeout(() => {
                if (scrollContainerRef.current) {
                  const newPixelsPerMs = newZoom / msPerDay;
                  const newCenterX = (centerTime - minTime) * newPixelsPerMs;
                  const newScrollLeft = newCenterX - container.clientWidth / 2;
                  container.scrollLeft = Math.max(0, newScrollLeft);
                }
              }, 0);
            } else {
              setZoom(newZoom);
            }
          }}
          style={{
            flex: 1,
            minWidth: "150px",
            maxWidth: "300px",
          }}
        />
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-color)",
            minWidth: "80px",
          }}
        >
          {zoom > 300
            ? "Hours"
            : zoom > 50
              ? "Days"
              : zoom > 5
                ? "Weeks"
                : "Months"}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={handleJumpToNow}
          style={{
            padding: "4px 12px",
            fontSize: "12px",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            background: "var(--bg-color)",
            color: "var(--text-color)",
            cursor: "pointer",
          }}
        >
          Jump to Now
        </button>
        <button
          onClick={handleFit}
          style={{
            padding: "4px 12px",
            fontSize: "12px",
            border: "1px solid var(--border-color)",
            borderRadius: "4px",
            background: "var(--bg-color)",
            color: "var(--text-color)",
            cursor: "pointer",
          }}
        >
          Fit All
        </button>
        <span style={{ fontSize: "11px", color: "var(--text-color)" }}>
          {events.length} {events.length === 1 ? "event" : "events"}
        </span>
      </div>

      {/* Timeline */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflow: "auto",
          background: "var(--timeline-bg)",
          minHeight: 0,
        }}
      >
        {events.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "var(--text-color)",
              fontSize: "14px",
            }}
          >
            No events to display. Add dates in the format:{" "}
            <code
              style={{
                margin: "0 4px",
                padding: "2px 6px",
                background: "var(--bg-color)",
                border: "1px solid var(--border-color)",
                borderRadius: "3px",
              }}
            >
              2024-01-15: Event description
            </code>
          </div>
        ) : (
          <svg
            width={timelineWidth}
            height={timelineHeight}
            style={{
              display: "block",
              colorScheme: "light dark",
            }}
          >
            {/* Time grid markers */}
            {timeMarkers.map((marker, idx) => (
              <g key={idx}>
                <line
                  x1={marker.x}
                  y1={0}
                  x2={marker.x}
                  y2={timelineHeight}
                  stroke="currentColor"
                  strokeWidth={marker.major ? 1.5 : 1}
                  opacity={marker.major ? 0.3 : 0.15}
                />
                <text
                  x={marker.x + 4}
                  y={15}
                  fontSize="10"
                  fill="currentColor"
                  opacity={marker.major ? 0.6 : 0.4}
                  style={{ userSelect: "none" }}
                >
                  {marker.label}
                </text>
              </g>
            ))}

            {/* Current time marker */}
            {currentTimeX >= 0 && currentTimeX <= timelineWidth && (
              <g style={{ color: "var(--current-time-color)" }}>
                <line
                  x1={currentTimeX}
                  y1={0}
                  x2={currentTimeX}
                  y2={timelineHeight}
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  opacity={0.6}
                />
                <text
                  x={currentTimeX + 5}
                  y={30}
                  fontSize="11"
                  fill="currentColor"
                  fontWeight="600"
                  style={{ userSelect: "none" }}
                >
                  Now
                </text>
              </g>
            )}

            {/* Gradient definitions for fuzz */}
            <defs>
              {positioned.map(({ event }, idx) => {
                if (!event.fuzz || event.fuzz.length === 0) return null;

                // Create gradient stops based on fuzz points
                const gradientId = `fuzz-gradient-${idx}`;
                const stops: Array<{
                  offset: string;
                  color: string;
                  opacity: number;
                }> = [];

                // Sample the gradient at regular intervals
                const samples = 30;
                for (let i = 0; i <= samples; i++) {
                  const t = i / samples;
                  let probability = 0;

                  // Sum contributions from all fuzz points
                  for (const fuzz of event.fuzz) {
                    const distance = Math.abs(t - fuzz.position);

                    // Use exponential decay curve to map precision to sigma (spread width)
                    // This gives consistent 2x visual separation between each precision level
                    // precision 0 (integers)      → sigma 0.20 (extremely wide)
                    // precision 1 (1 decimal)     → sigma 0.12 (very wide spread)
                    // precision 2 (2 decimals)    → sigma 0.06 (moderate spread)
                    // precision 3 (3 decimals)    → sigma 0.03 (narrow)
                    // precision 4+ (4+ decimals)  → sigma 0.015 (very sharp)
                    const sigma = 0.25 * Math.exp(-fuzz.precision * 0.7);

                    const contribution = Math.exp(
                      -Math.pow(distance, 2) / (2 * sigma * sigma)
                    );
                    probability += contribution;
                  }

                  // Normalize probability (0 to 1)
                  const normalizedProb = Math.min(1, probability);

                  // Create heatmap colors in LAB color space for perceptual uniformity
                  // LAB interpolation: blue (cool/low) -> cyan -> green -> yellow -> red (hot/high)
                  let L: number, a: number, b: number;
                  let opacity: number;

                  if (normalizedProb < 0.25) {
                    // Blue to Cyan (cool region)
                    const t = normalizedProb / 0.25;
                    L = 40 + t * 30; // 40 -> 70
                    a = 30 - t * 50; // 30 -> -20
                    b = -60 + t * 20; // -60 -> -40
                    opacity = 0.3 + t * 0.3;
                  } else if (normalizedProb < 0.5) {
                    // Cyan to Green
                    const t = (normalizedProb - 0.25) / 0.25;
                    L = 70 + t * 15; // 70 -> 85
                    a = -20 - t * 20; // -20 -> -40
                    b = -40 + t * 70; // -40 -> 30
                    opacity = 0.6 + t * 0.1;
                  } else if (normalizedProb < 0.75) {
                    // Green to Yellow
                    const t = (normalizedProb - 0.5) / 0.25;
                    L = 85 + t * 5; // 85 -> 90
                    a = -40 + t * 30; // -40 -> -10
                    b = 30 + t * 50; // 30 -> 80
                    opacity = 0.7 + t * 0.15;
                  } else {
                    // Yellow to Red (hot region)
                    const t = (normalizedProb - 0.75) / 0.25;
                    L = 90 - t * 30; // 90 -> 60
                    a = -10 + t * 90; // -10 -> 80
                    b = 80 - t * 20; // 80 -> 60
                    opacity = 0.85 + t * 0.15;
                  }

                  // Convert LAB to RGB
                  const labToRgb = (
                    L: number,
                    a: number,
                    b: number
                  ): [number, number, number] => {
                    // LAB to XYZ
                    let y = (L + 16) / 116;
                    let x = a / 500 + y;
                    let z = y - b / 200;

                    const labF = (t: number) =>
                      t > 0.206897 ? t * t * t : (t - 16 / 116) / 7.787;

                    x = 0.95047 * labF(x);
                    y = 1.0 * labF(y);
                    z = 1.08883 * labF(z);

                    // XYZ to RGB
                    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
                    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
                    let bl = x * 0.0557 + y * -0.204 + z * 1.057;

                    // Gamma correction
                    const gammaCorrect = (c: number) =>
                      c > 0.0031308
                        ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055
                        : 12.92 * c;

                    r = gammaCorrect(r);
                    g = gammaCorrect(g);
                    bl = gammaCorrect(bl);

                    // Clamp and convert to 0-255
                    return [
                      Math.max(0, Math.min(255, Math.round(r * 255))),
                      Math.max(0, Math.min(255, Math.round(g * 255))),
                      Math.max(0, Math.min(255, Math.round(bl * 255))),
                    ];
                  };

                  const [r, g, bl] = labToRgb(L, a, b);
                  const color = `rgb(${r},${g},${bl})`;

                  stops.push({
                    offset: `${t * 100}%`,
                    color,
                    opacity,
                  });
                }

                return (
                  <linearGradient
                    key={gradientId}
                    id={gradientId}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    {stops.map((stop, i) => (
                      <stop
                        key={i}
                        offset={stop.offset}
                        stopColor={stop.color}
                        stopOpacity={stop.opacity}
                      />
                    ))}
                  </linearGradient>
                );
              })}
            </defs>

            {/* Event ranges */}
            {positioned.map(({ event, row }, idx) => {
              const { start, end } = getEventTimeRange(event);
              const x = timeToX(start);
              const width = timeToX(end) - x;
              const y = row * ROW_HEIGHT + ROW_PADDING + 60;
              const barHeight = ROW_HEIGHT - ROW_PADDING * 2;
              const hasFuzz = event.fuzz && event.fuzz.length > 0;
              const gradientId = `fuzz-gradient-${idx}`;

              return (
                <g key={idx}>
                  {/* Base bar */}
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={barHeight}
                    fill="var(--event-fill)"
                    fillOpacity={0.4}
                    stroke="var(--event-stroke)"
                    strokeWidth={2}
                    rx={4}
                  />

                  {/* Fuzz gradient overlay */}
                  {hasFuzz && (
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={barHeight}
                      fill={`url(#${gradientId})`}
                      rx={4}
                    />
                  )}

                  {/* Label */}
                  <text
                    x={x + 8}
                    y={y + barHeight / 2 + 4}
                    fontSize="12"
                    fill="currentColor"
                    style={{ userSelect: "none" }}
                  >
                    {event.description.length > 40
                      ? event.description.substring(0, 37) + "..."
                      : event.description}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
