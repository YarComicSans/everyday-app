export type GspErrorKind = 'network' | 'http' | 'parse';

/**
 * Everything needed to debug a failed GSP request: which step, which URL,
 * the HTTP status, and the response body exactly as received.
 */
export class GspError extends Error {
  kind: GspErrorKind;
  step: string;
  url: string;
  status: number | null;
  body: string;

  constructor(opts: {
    kind: GspErrorKind;
    step: string;
    url: string;
    status?: number | null;
    body: string;
    detail?: string;
  }) {
    const what =
      opts.kind === 'network'
        ? 'network error'
        : opts.kind === 'http'
          ? `HTTP ${opts.status}`
          : `could not parse response${opts.detail ? `: ${opts.detail}` : ''}`;
    super(`${opts.step}: ${what}`);
    this.name = 'GspError';
    this.kind = opts.kind;
    this.step = opts.step;
    this.url = opts.url;
    this.status = opts.status ?? null;
    this.body = opts.body;
  }
}
