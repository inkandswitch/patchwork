/**
 * macOS system bridge — available at `window.macintosh` when running inside Tauri.
 *
 * Provides access to:
 *  - Process listing (all processes + GUI apps)
 *  - Command execution
 *  - Reminders
 *  - Calendar
 *  - PTY shell sessions (for xterm.js / xterm-pty)
 *  - System info
 *  - Raw AppleScript / JXA execution
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProcessInfo {
  pid: number;
  name: string;
  memory: number;
  cmd: string[];
}

export interface RunningApp {
  name: string;
  bundleId: string | null;
  pid: number;
  active: boolean;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  code: number;
}

export interface ReminderList {
  id: string;
  name: string;
}

export interface Reminder {
  name: string;
  completed: boolean;
  dueDate: string | null;
  body: string | null;
  list?: string;
}

export interface CalendarInfo {
  uid: string;
  name: string;
  writable: boolean;
}

export interface CalendarEvent {
  uid: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string | null;
  notes: string | null;
  calendar: string;
}

export interface ShellSession {
  id: number;
  write(data: string): Promise<void>;
  resize(rows: number, cols: number): Promise<void>;
  kill(): Promise<void>;
  onData(callback: (data: string) => void): () => void;
  onExit(callback: () => void): () => void;
}

export interface Macintosh {
  available: true;

  /** List all running processes (sorted by memory usage descending). */
  processes(): Promise<ProcessInfo[]>;

  /** List running GUI applications via NSWorkspace. */
  runningApps(): Promise<RunningApp[]>;

  /** Execute a command and return stdout, stderr, and exit code. */
  execute(
    command: string,
    args?: string[],
    options?: { cwd?: string; env?: Record<string, string> }
  ): Promise<ExecResult>;

  reminders: {
    getLists(): Promise<ReminderList[]>;
    getReminders(listName?: string): Promise<Reminder[]>;
    create(
      title: string,
      options?: { list?: string; notes?: string; dueDate?: string }
    ): Promise<string>;
    complete(title: string, listName?: string): Promise<void>;
  };

  calendar: {
    getCalendars(): Promise<CalendarInfo[]>;
    getEvents(options?: {
      calendar?: string;
      from?: string;
      to?: string;
    }): Promise<CalendarEvent[]>;
    createEvent(
      title: string,
      options: {
        calendar?: string;
        startDate: string;
        endDate: string;
        location?: string;
        notes?: string;
      }
    ): Promise<string>;
  };

  shell: {
    spawn(options?: {
      command?: string;
      args?: string[];
      cwd?: string;
      rows?: number;
      cols?: number;
      env?: Record<string, string>;
    }): Promise<ShellSession>;
  };

  system: {
    hostname(): Promise<string>;
    frontmostApp(): Promise<{
      name: string;
      bundleId: string | null;
      pid: number;
    }>;
  };

  /** Run raw AppleScript and return the result. */
  applescript(script: string): Promise<string>;

  /** Run raw JXA (JavaScript for Automation) and return the result. */
  jxa(script: string): Promise<string>;
}

// ─── Global augmentation ─────────────────────────────────────────────────────

declare global {
  interface Window {
    macintosh?: Macintosh;
  }
}

// ─── Initialization ──────────────────────────────────────────────────────────

export function initMacintosh() {
  if (!("__TAURI__" in window)) return;

  const { invoke } = window.__TAURI__.core;
  const { listen } = window.__TAURI__.event;

  const macintosh: Macintosh = {
    available: true,

    processes: () => invoke("mac_list_processes"),

    runningApps: () => invoke("mac_running_apps"),

    execute: (command, args, options) =>
      invoke("mac_execute", {
        command,
        args: args ?? null,
        cwd: options?.cwd ?? null,
        env: options?.env ?? null,
      }),

    reminders: {
      getLists: () => invoke("mac_reminders_get_lists"),

      getReminders: (listName) =>
        invoke("mac_reminders_get_items", { listName: listName ?? null }),

      create: (title, options) =>
        invoke("mac_reminders_create", {
          title,
          listName: options?.list ?? null,
          notes: options?.notes ?? null,
          dueDate: options?.dueDate ?? null,
        }),

      complete: (title, listName) =>
        invoke("mac_reminders_complete", {
          title,
          listName: listName ?? null,
        }),
    },

    calendar: {
      getCalendars: () => invoke("mac_calendar_get_calendars"),

      getEvents: (options) =>
        invoke("mac_calendar_get_events", {
          calendarName: options?.calendar ?? null,
          fromDate: options?.from ?? null,
          toDate: options?.to ?? null,
        }),

      createEvent: (title, options) =>
        invoke("mac_calendar_create_event", {
          title,
          startDate: options.startDate,
          endDate: options.endDate,
          calendarName: options.calendar ?? null,
          location: options.location ?? null,
          notes: options.notes ?? null,
        }),
    },

    shell: {
      spawn: async (options) => {
        const id: number = await invoke("mac_shell_spawn", {
          command: options?.command ?? null,
          args: options?.args ?? null,
          cwd: options?.cwd ?? null,
          rows: options?.rows ?? 24,
          cols: options?.cols ?? 80,
          env: options?.env ?? null,
        });

        const dataCallbacks = new Set<(data: string) => void>();
        const exitCallbacks = new Set<() => void>();
        const unlisteners: Array<() => void> = [];

        listen(`macintosh://shell/${id}/data`, (event: any) => {
          const data = event.payload as string;
          dataCallbacks.forEach((cb) => cb(data));
        }).then((u) => unlisteners.push(u));

        listen(`macintosh://shell/${id}/exit`, () => {
          exitCallbacks.forEach((cb) => cb());
          // Auto-cleanup listeners on exit
          unlisteners.forEach((u) => u());
        }).then((u) => unlisteners.push(u));

        return {
          id,
          write: (data: string) =>
            invoke("mac_shell_write", { id, data }),
          resize: (rows: number, cols: number) =>
            invoke("mac_shell_resize", { id, rows, cols }),
          kill: async () => {
            await invoke("mac_shell_kill", { id });
            unlisteners.forEach((u) => u());
          },
          onData: (cb) => {
            dataCallbacks.add(cb);
            return () => {
              dataCallbacks.delete(cb);
            };
          },
          onExit: (cb) => {
            exitCallbacks.add(cb);
            return () => {
              exitCallbacks.delete(cb);
            };
          },
        };
      },
    },

    system: {
      hostname: () => invoke("mac_system_hostname"),
      frontmostApp: () => invoke("mac_frontmost_app"),
    },

    applescript: (script) => invoke("mac_run_applescript", { script }),

    jxa: (script) => invoke("mac_run_jxa", { script }),
  };

  window.macintosh = macintosh;
  console.info("[macintosh] bridge initialized — APIs available at window.macintosh");
}
