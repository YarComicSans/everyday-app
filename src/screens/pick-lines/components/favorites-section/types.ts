import type { LineInfo, LineSelection } from '@/services/gspns';

export type FavoritesSectionProps = {
  /** True while the user is picking Lines by hand. */
  hidden: boolean;
  /** Today's line list, for current GSP request values. */
  lineInfos: LineInfo[];
  now: Date;
  /** Opens the Timetable for a Favorite's selection, with current request values. */
  onOpen: (selection: LineSelection[]) => void;
};
