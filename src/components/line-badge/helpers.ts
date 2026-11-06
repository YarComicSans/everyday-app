const PALETTE = [
  '#E5484D',
  '#3E63DD',
  '#30A46C',
  '#F76B15',
  '#8E4EC6',
  '#0090FF',
  '#D6409F',
  '#AD7F58',
  '#12A594',
  '#BD8A00',
];

/** Deterministic colour per line number, stable across screens and sessions. */
export function lineColor(line: string): string {
  let hash = 0;
  for (const c of line) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
