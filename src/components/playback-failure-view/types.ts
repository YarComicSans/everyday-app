/** Mirrors the `youtube` service's `VideoErrorKind`; kept local so the view takes plain props. */
export type FailureKind = 'limited' | 'unplayable' | 'unavailable' | 'offline' | 'failed';

export type FailureAction = 'retry' | 'open' | 'back';

export type FailureContent = {
  message: string;
  /** Extra advice under the message, e.g. switching networks. */
  hint?: string;
  /** Short error code to show and report (`failed` only). */
  code?: string;
  actions: FailureAction[];
};

export type PlaybackFailureViewProps = {
  kind: FailureKind;
  code?: string;
  onRetry: () => void;
  onOpenInYouTube: () => void;
  onBack: () => void;
};
