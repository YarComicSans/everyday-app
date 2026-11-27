import { Pressable, TextInput, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';
import type { SearchBoxProps } from './types';

/** The one box on the Search screen: a query or a pasted Video Link. */
export function SearchBox({ value, onChangeText, onSubmit, disabled }: SearchBoxProps) {
  const theme = useTheme();

  return (
    <View style={[styles.box, { backgroundColor: theme.backgroundElement }, disabled && styles.disabled]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        editable={!disabled}
        placeholder="Search or paste a link"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        inputMode="search"
        accessibilityLabel="Search or paste a link"
        style={[styles.input, { color: theme.text }]}
      />
      {value && !disabled ? (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={Spacing.two}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.clear}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            ✕
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}
