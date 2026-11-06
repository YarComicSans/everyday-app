import type { PickerLine } from '@/services/gspns';

/** Selected line id → chosen direction index, in the order the user picked them. */
export type PickedLines = Record<string, number>;

export function toggleLine(picked: PickedLines, id: string): PickedLines {
  if (id in picked) {
    const { [id]: _removed, ...rest } = picked;
    return rest;
  }
  return { ...picked, [id]: 0 };
}

export function pickedSelection(picked: PickedLines, lines: PickerLine[]) {
  return Object.entries(picked).flatMap(([id, index]) => {
    const dir = lines.find((l) => l.id === id)?.directions[index];
    return dir ? [dir.selection] : [];
  });
}
