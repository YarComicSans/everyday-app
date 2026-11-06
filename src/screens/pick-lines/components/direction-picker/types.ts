import type { PickerLine } from '@/services/gspns';

export type DirectionPickerProps = {
  line: PickerLine;
  selectedIndex: number;
  onSelect: (index: number) => void;
  onRemove: () => void;
};
