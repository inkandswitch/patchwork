export type MessageToWorklet =
  | {
      command: 'load patch';
      code: string;
      params: SharedArrayBuffer;
    }
  | { command: 'process midi message'; data: Uint8Array };

export type MessageFromWorklet = { event: 'log'; message: string };
