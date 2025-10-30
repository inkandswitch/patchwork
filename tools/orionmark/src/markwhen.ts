// Date granularity levels
export type DateGranularity = "year" | "month" | "day";

// Structured date representation
export interface MarkwhenDate {
  granularity: DateGranularity;
  year: number;
  month?: number; // 1-12
  day?: number; // 1-31
}

// Duration representation
export interface Duration {
  amount: number;
  unit: "year" | "month" | "week" | "day";
}

// Fuzz point for temporal uncertainty
export interface FuzzPoint {
  position: number; // 0-1, where in the range
  precision: number; // 0-4, number of decimal places (controls sharpness)
}

// Complete event structure
export interface MarkwhenEvent {
  start: MarkwhenDate;
  end?: MarkwhenDate | Duration;
  description: string;
  line: number;
  fuzz?: FuzzPoint[];
}

// ============================================================================
// Constants & Patterns
// ============================================================================

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

// Date format patterns
const ISO_DATE_PATTERN = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;
const CASUAL_DATE_PATTERN =
  /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})$/i;
const CASUAL_DATE_ALT_PATTERN =
  /^(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})$/i;
const MONTH_YEAR_PATTERN =
  /^(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})$/i;

const DURATION_PATTERN =
  /^(\d+)\s*(year|years|month|months|week|weeks|day|days)s?$/i;
const FUZZ_PATTERN = /~(\d*\.?\d+)/g;

// ============================================================================
// Date Parsing
// ============================================================================

function parseDate(dateStr: string): MarkwhenDate | null {
  const trimmed = dateStr.trim();

  // Try ISO format: 2024, 2024-01, 2024-01-15
  let match = trimmed.match(ISO_DATE_PATTERN);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = match[2] ? parseInt(match[2], 10) : undefined;
    const day = match[3] ? parseInt(match[3], 10) : undefined;

    // Validate ranges
    if (month !== undefined && (month < 1 || month > 12)) return null;
    if (day !== undefined && (day < 1 || day > 31)) return null;

    const granularity: DateGranularity = day ? "day" : month ? "month" : "year";
    return { granularity, year, month, day };
  }

  // Try casual date: January 15, 2024
  match = trimmed.match(CASUAL_DATE_PATTERN);
  if (match) {
    const monthName = match[1].toLowerCase();
    const month = MONTH_NAMES[monthName];
    const day = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (!month || day < 1 || day > 31) return null;
    return { granularity: "day", year, month, day };
  }

  // Try casual date alt: 15 January 2024
  match = trimmed.match(CASUAL_DATE_ALT_PATTERN);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2].toLowerCase();
    const month = MONTH_NAMES[monthName];
    const year = parseInt(match[3], 10);

    if (!month || day < 1 || day > 31) return null;
    return { granularity: "day", year, month, day };
  }

  // Try month + year: January 2024
  match = trimmed.match(MONTH_YEAR_PATTERN);
  if (match) {
    const monthName = match[1].toLowerCase();
    const month = MONTH_NAMES[monthName];
    const year = parseInt(match[2], 10);

    if (!month) return null;
    return { granularity: "month", year, month };
  }

  return null;
}

// ============================================================================
// Duration Parsing
// ============================================================================

function parseDuration(durationStr: string): Duration | null {
  const trimmed = durationStr.trim();
  const match = trimmed.match(DURATION_PATTERN);

  if (!match) return null;

  const amount = parseInt(match[1], 10);
  const unit = match[2].toLowerCase().replace(/s$/, "") as Duration["unit"];

  return { amount, unit };
}

// ============================================================================
// Fuzz Parsing
// ============================================================================

function countDecimalPlaces(numStr: string): number {
  const match = numStr.match(/\.(\d+)/);
  return match ? match[1].length : 0;
}

function normalizePosition(posStr: string): number {
  const num = parseFloat(posStr);

  // Check if it has a decimal point
  const hasDecimal = posStr.includes(".");

  if (hasDecimal) {
    // Has decimal: treat as-is (0.5, 1.0, etc.)
    return Math.max(0, Math.min(1, num));
  } else {
    // No decimal: treat as shorthand (1 → 0.1, 5 → 0.5, 10 → 1.0)
    return Math.max(0, Math.min(1, num / 10));
  }
}

function parseFuzzPoints(fuzzStr: string): FuzzPoint[] {
  const points: FuzzPoint[] = [];
  const matches = fuzzStr.matchAll(FUZZ_PATTERN);

  for (const match of matches) {
    const positionStr = match[1];
    const position = normalizePosition(positionStr);
    const precision = countDecimalPlaces(positionStr);

    points.push({ position, precision });
  }

  return points;
}

// ============================================================================
// Date Range Parsing
// ============================================================================

interface ParsedDateRange {
  start: MarkwhenDate;
  end?: MarkwhenDate | Duration;
  fuzz?: FuzzPoint[];
}

function extractFuzz(dateStr: string): { cleaned: string; fuzz?: FuzzPoint[] } {
  const fuzzMatch = dateStr.match(/^(.+?)\s*((?:~\d*\.?\d+\s*)+)$/);
  if (fuzzMatch) {
    return {
      cleaned: fuzzMatch[1].trim(),
      fuzz: parseFuzzPoints(fuzzMatch[2]),
    };
  }
  return { cleaned: dateStr };
}

function parseDateRange(dateRangeStr: string): ParsedDateRange | null {
  const { cleaned, fuzz } = extractFuzz(dateRangeStr.trim());

  // Try explicit range: 2024-01-15 - 2024-12-31
  const dashMatch = cleaned.match(/^(.+?)\s+-\s+(.+)$/);
  if (dashMatch) {
    const start = parseDate(dashMatch[1]);
    const end = parseDate(dashMatch[2]);
    if (start && end) {
      return { start, end, fuzz };
    }
  }

  // Try duration: feb 2025 / 1 year
  const slashMatch = cleaned.match(/^(.+?)\s*\/\s*(.+)$/);
  if (slashMatch) {
    const start = parseDate(slashMatch[1]);
    const duration = parseDuration(slashMatch[2]);

    if (start && duration) {
      return { start, end: duration, fuzz };
    }

    // Fallback: slash between two dates
    const end = parseDate(slashMatch[2]);
    if (start && end) {
      return { start, end, fuzz };
    }
  }

  // Single date
  const singleDate = parseDate(cleaned);
  if (singleDate) {
    return { start: singleDate, fuzz };
  }

  return null;
}

// ============================================================================
// Event Parsing
// ============================================================================

function collectMultilineDescription(
  lines: string[],
  startIdx: number
): { text: string; linesConsumed: number } {
  const collected: string[] = [];
  let consumed = 0;

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") {
      break;
    }
    collected.push(line);
    consumed++;
  }

  return {
    text: collected.join("\n") || "(no description)",
    linesConsumed: consumed,
  };
}

export function parseMarkwhenEvents(content: string): MarkwhenEvent[] {
  const events: MarkwhenEvent[] = [];
  const lines = content.split("\n");
  const processedLines = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    if (processedLines.has(i)) continue;

    const line = lines[i].trim();
    if (!line) continue;

    // Look for Markwhen pattern: [date/range]: [description]
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const beforeColon = line.substring(0, colonIndex).trim();
    const afterColon = line.substring(colonIndex + 1).trim();

    // Strip markdown heading markers
    const cleanBeforeColon = beforeColon.replace(/^#{1,6}\s*/, "");

    // Try to parse as date/range
    const parsed = parseDateRange(cleanBeforeColon);
    if (!parsed) continue;

    processedLines.add(i);

    // Get description (inline or multiline)
    let description: string;
    if (afterColon) {
      description = afterColon;
    } else {
      const { text, linesConsumed } = collectMultilineDescription(lines, i + 1);
      description = text;
      for (let j = 1; j <= linesConsumed; j++) {
        processedLines.add(i + j);
      }
    }

    events.push({
      start: parsed.start,
      end: parsed.end,
      description,
      line: i + 1,
      fuzz: parsed.fuzz,
    });
  }

  return events;
}

// ============================================================================
// Display Formatters
// ============================================================================

const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDate(date: MarkwhenDate): string {
  if (date.granularity === "year") {
    return `${date.year}`;
  }

  if (date.granularity === "month" && date.month) {
    return `${MONTH_NAMES_SHORT[date.month - 1]} ${date.year}`;
  }

  if (date.granularity === "day" && date.month && date.day) {
    return `${MONTH_NAMES_SHORT[date.month - 1]} ${date.day}, ${date.year}`;
  }

  return `${date.year}`;
}

export function formatDuration(duration: Duration): string {
  const unit = duration.amount > 1 ? `${duration.unit}s` : duration.unit;
  return `+${duration.amount} ${unit}`;
}

export function formatEnd(end: MarkwhenDate | Duration): string {
  if ("granularity" in end) {
    return formatDate(end);
  }
  return formatDuration(end);
}
