export interface EvalResult {
  result: string | null;
  error: string | null;
}

export interface ShareItem {
  text?: string;
  url?: string;
  title?: string;
  mimeType?: string;
  data?: Uint8Array;
}
