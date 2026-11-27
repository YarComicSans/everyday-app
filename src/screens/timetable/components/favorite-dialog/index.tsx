import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, TextInput, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_FAVORITE_NAME } from '@/services/favorites';

import { CONFIRM_COLOR, DESTRUCTIVE_COLOR, styles } from './styles';
import type { FavoriteDialogMode, FavoriteDialogProps } from './types';

/** Name prompt when saving a Favorite, confirmation when removing one. Same look on every platform. */
export function FavoriteDialog({ mode, onConfirm, onCancel }: FavoriteDialogProps) {
  return (
    <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        {/* Remounted per opening, so the name starts from the default every time. */}
        {mode && <Dialog key={mode.kind} mode={mode} onConfirm={onConfirm} onCancel={onCancel} />}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Dialog({ mode, onConfirm, onCancel }: FavoriteDialogProps & { mode: FavoriteDialogMode }) {
  const theme = useTheme();
  const [name, setName] = useState(DEFAULT_FAVORITE_NAME);
  const saving = mode.kind === 'save';
  const canConfirm = !saving || name.trim().length > 0;
  const confirm = () => canConfirm && onConfirm(name.trim());

  return (
    <ThemedView style={styles.dialog} accessibilityViewIsModal>
      <ThemedText style={styles.title}>
        {saving ? 'Save as Favorite' : 'Remove Favorite?'}
      </ThemedText>
      {saving ? (
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          selectTextOnFocus
          maxLength={40}
          returnKeyType="done"
          onSubmitEditing={confirm}
          accessibilityLabel="Favorite name"
          placeholder="Name"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          “{mode.name}” will no longer appear on the Pick lines screen.
        </ThemedText>
      )}
      <View style={styles.buttons}>
        <Pressable onPress={onCancel} accessibilityRole="button" style={styles.button}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Cancel
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={confirm}
          disabled={!canConfirm}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canConfirm }}
          style={({ pressed }) => [styles.button, { opacity: !canConfirm ? 0.4 : pressed ? 0.6 : 1 }]}>
          <ThemedText type="smallBold" style={{ color: saving ? CONFIRM_COLOR : DESTRUCTIVE_COLOR }}>
            {saving ? 'Save' : 'Remove'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}
