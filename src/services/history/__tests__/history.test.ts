import { createHistory } from '../history';
import { memoryStorage } from '../memory-storage';

const video = (id: string, durationSeconds = 600) => ({
  id,
  title: `Title ${id}`,
  channel: `Channel ${id}`,
  durationSeconds,
  thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
});

function setup() {
  let now = 1_000;
  const history = createHistory(memoryStorage(), () => now);
  return { history, tick: (ms = 1_000) => (now += ms) };
}

describe('Resume Position', () => {
  it('resumes at 0 when the saved position is under 10 s', () => {
    const { history } = setup();
    history.recordStart(video('a'));
    history.savePosition('a', 9.5, 600);
    expect(history.resumeAt('a')).toBe(0);
    history.savePosition('a', 10, 600);
    expect(history.resumeAt('a')).toBe(10);
  });

  it('marks the Video Watched in its last 5% and resumes at 0', () => {
    const { history } = setup();
    history.recordStart(video('a', 200));
    history.savePosition('a', 189, 200); // 94.5%
    expect(history.list()[0]).toMatchObject({ watched: false, resumePosition: 189 });
    expect(history.resumeAt('a')).toBe(189);

    history.savePosition('a', 190, 200); // exactly 95%
    expect(history.list()[0]).toMatchObject({ watched: true, resumePosition: 190 });
    expect(history.resumeAt('a')).toBe(0);
  });

  it('clears Watched when a later save is below the last 5%', () => {
    const { history } = setup();
    history.recordStart(video('a', 200));
    history.savePosition('a', 200, 200);
    expect(history.list()[0].watched).toBe(true);

    history.savePosition('a', 42, 200);
    expect(history.list()[0]).toMatchObject({ watched: false, resumePosition: 42 });
    expect(history.resumeAt('a')).toBe(42);
  });

  it('never marks a Video of unknown length Watched', () => {
    const { history } = setup();
    history.recordStart(video('live', 0));
    history.savePosition('live', 3_600, 0);
    expect(history.list()[0].watched).toBe(false);
    expect(history.resumeAt('live')).toBe(3_600);
  });

  it('resumes at 0 for a Video not in History', () => {
    const { history } = setup();
    expect(history.resumeAt('nope')).toBe(0);
  });
});

describe('History Entries', () => {
  it('lists Videos most recent first', () => {
    const { history, tick } = setup();
    history.recordStart(video('a'));
    tick();
    history.recordStart(video('b'));
    tick();
    history.recordStart(video('c'));
    expect(history.list().map((e) => e.videoId)).toEqual(['c', 'b', 'a']);
  });

  it('keeps one entry per Video, moves it to the top and keeps its Resume Position', () => {
    const { history, tick } = setup();
    history.recordStart(video('a'));
    history.savePosition('a', 120, 600);
    tick();
    history.recordStart(video('b'));
    tick();
    history.recordStart({ ...video('a'), title: 'Renamed' });

    const entries = history.list();
    expect(entries.map((e) => e.videoId)).toEqual(['a', 'b']);
    expect(entries[0]).toEqual({
      videoId: 'a',
      title: 'Renamed',
      channel: 'Channel a',
      durationSeconds: 600,
      thumbnailUrl: 'https://i.ytimg.com/vi/a/hqdefault.jpg',
      lastWatchedAt: 3_000,
      resumePosition: 120,
      watched: false,
    });
    expect(history.resumeAt('a')).toBe(120);
  });

  it('starts a new entry at 0, not Watched', () => {
    const { history } = setup();
    history.recordStart(video('a'));
    expect(history.list()).toEqual([
      expect.objectContaining({ videoId: 'a', resumePosition: 0, watched: false, lastWatchedAt: 1_000 }),
    ]);
  });

  it('ignores a position saved for a Video not in History', () => {
    const { history } = setup();
    history.savePosition('unknown', 120, 600);
    expect(history.list()).toEqual([]);
  });

  it('removes one entry together with its Resume Position', () => {
    const { history, tick } = setup();
    history.recordStart(video('a'));
    history.savePosition('a', 120, 600);
    tick();
    history.recordStart(video('b'));

    history.remove('a');
    expect(history.list().map((e) => e.videoId)).toEqual(['b']);
    expect(history.resumeAt('a')).toBe(0);

    history.recordStart(video('a'));
    expect(history.resumeAt('a')).toBe(0);
  });

  it('clears all entries and their Resume Positions', () => {
    const { history } = setup();
    history.recordStart(video('a'));
    history.savePosition('a', 120, 600);
    history.recordStart(video('b'));

    history.clear();
    expect(history.list()).toEqual([]);
    expect(history.resumeAt('a')).toBe(0);
  });
});
