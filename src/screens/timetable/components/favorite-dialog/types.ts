/** `save` asks for a name; `remove` asks to confirm removing the Favorite called `name`. */
export type FavoriteDialogMode = { kind: 'save' } | { kind: 'remove'; name: string };

export type FavoriteDialogProps = {
  /** Hidden when null. */
  mode: FavoriteDialogMode | null;
  /** `name` is the entered name when saving. */
  onConfirm: (name: string) => void;
  onCancel: () => void;
};
