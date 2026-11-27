import type { QualityMode } from '@/services/playback';

export type QualityControlProps = {
  value: QualityMode;
  onChange: (mode: QualityMode) => void;
};
