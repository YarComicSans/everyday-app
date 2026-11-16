import type { FailureAction, FailureContent, FailureKind } from './types';

const CONTENT: Record<FailureKind, { message: string; hint?: string; actions: FailureAction[] }> = {
  limited: {
    message: 'YouTube is limiting this network',
    hint: 'Try switching between Wi-Fi and mobile data.',
    actions: ['retry'],
  },
  unplayable: { message: "Can't be played in this app", actions: ['open'] },
  unavailable: { message: 'Video unavailable', actions: ['back'] },
  offline: { message: "You're offline", actions: ['retry'] },
  failed: { message: 'Playback failed', actions: ['retry', 'open'] },
};

/** The message, optional hint and code, and actions the playback failure view shows for a failure kind. */
export function failureContent(kind: FailureKind, code?: string): FailureContent {
  const content = CONTENT[kind];
  return kind === 'failed' && code ? { ...content, code } : { ...content };
}
