import { Pressable } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';
import { DepartureRow } from '@/components/departure-row';

import type { LineNext } from '../../helpers';
import { styles } from './styles';
import type { FavoriteCardProps, FavoriteCardState } from './types';

/** One Favorite on the Pick lines screen: its name and the NEXT bus of each Line. Opens its Timetable. */
export function FavoriteCard({ name, lineNumbers, state, onPress }: FavoriteCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name}, lines ${lineNumbers.join(', ')}`}
      accessibilityHint="Opens the timetable"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
          {name}
        </ThemedText>
        <Body state={state} />
      </ThemedView>
    </Pressable>
  );
}

function Body({ state }: { state: FavoriteCardState }) {
  if (state.kind !== 'ready') {
    return (
      <Message last>{state.kind === 'loading' ? 'Loading departures…' : 'Couldn’t load departures.'}</Message>
    );
  }
  return state.lines.map((l, i) =>
    l.kind === 'next' ? (
      // Disabled rows don't take the touch, so tapping one opens the Favorite.
      <DepartureRow key={`${l.departure.lineNumber}-${i}`} departure={l.departure} index={i} status="next" />
    ) : (
      <Message key={`${l.lineNumber}-${i}`} last={i === state.lines.length - 1}>
        {messageOf(l)}
      </Message>
    ),
  );
}

const messageOf = (l: Exclude<LineNext, { kind: 'next' }>) =>
  l.kind === 'done' ? `Line ${l.lineNumber}: no more departures today.` : `Line ${l.lineNumber} doesn’t run today.`;

function Message({ children, last }: { children: string; last?: boolean }) {
  return (
    <ThemedText type="small" themeColor="textSecondary" style={[styles.message, last && styles.last]}>
      {children}
    </ThemedText>
  );
}
