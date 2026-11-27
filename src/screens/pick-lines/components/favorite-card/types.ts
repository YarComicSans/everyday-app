import type { LineNext } from '../../helpers';

export type FavoriteCardState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; lines: LineNext[] };

export type FavoriteCardProps = {
  name: string;
  /** Line numbers, for the accessibility label. */
  lineNumbers: string[];
  state: FavoriteCardState;
  onPress: () => void;
};
