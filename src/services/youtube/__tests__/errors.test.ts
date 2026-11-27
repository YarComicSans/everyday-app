import { loadVideo, resolveStream, search, VideoError, type VideoErrorKind } from '..';
import { BOT_WALL_ID, installFakeYouTube, PRIVATE_ID } from '../__fixtures__/replay';

const youtube = installFakeYouTube();

afterEach(() => youtube.setNetwork({ mode: 'replay' }));
afterAll(() => youtube.restore());

async function failure(work: Promise<unknown>): Promise<VideoError> {
  try {
    await work;
  } catch (e) {
    expect(e).toBeInstanceOf(VideoError);
    return e as VideoError;
  }
  throw new Error('expected a VideoError');
}

describe.each([
  ['loadVideo', loadVideo],
  ['resolveStream', resolveStream],
])('%s failures', (_, load) => {
  it.each<[string, string, VideoErrorKind]>([
    ['a made-for-kids Video (UNPLAYABLE)', 'XqZsoesa55w', 'unplayable'],
    ['a removed Video', 'aaaaaaaaaaa', 'unavailable'],
    ['a private Video', PRIVATE_ID, 'unavailable'],
    ['the bot wall', BOT_WALL_ID, 'limited'],
  ])('reports %s as %s', async (_label, id, kind) => {
    const error = await failure(load(id));
    expect(error.kind).toBe(kind);
  });

  it('reports a rate limit (HTTP 429) as limited', async () => {
    youtube.setNetwork({ mode: 'status', endpoint: 'player', status: 429 });
    expect((await failure(load('dQw4w9WgXcQ'))).kind).toBe('limited');
  });

  it('reports no connection as offline', async () => {
    youtube.setNetwork({ mode: 'offline' });
    expect((await failure(load('dQw4w9WgXcQ'))).kind).toBe('offline');
  });

  it('reports any other HTTP failure as failed with a short code', async () => {
    youtube.setNetwork({ mode: 'status', endpoint: 'player', status: 500 });
    const error = await failure(load('dQw4w9WgXcQ'));
    expect(error.kind).toBe('failed');
    expect(error.code).toBe('http-500');
  });
});

describe('search failures', () => {
  it('reports no connection as offline', async () => {
    youtube.setNetwork({ mode: 'offline' });
    expect((await failure(search('lofi'))).kind).toBe('offline');
  });

  it('reports a rate limit (HTTP 429) as limited', async () => {
    youtube.setNetwork({ mode: 'status', endpoint: 'search', status: 429 });
    expect((await failure(search('lofi'))).kind).toBe('limited');
  });
});

describe('after a bot wall', () => {
  it('starts a new session for the next request', async () => {
    await loadVideo('dQw4w9WgXcQ'); // a session exists
    await failure(loadVideo(BOT_WALL_ID));
    youtube.requests.length = 0;

    await loadVideo('dQw4w9WgXcQ');

    expect(youtube.requests).toContain('sw.js_data.txt');
  });

  it('keeps the session after other failures', async () => {
    await loadVideo('dQw4w9WgXcQ');
    await failure(loadVideo('aaaaaaaaaaa'));
    youtube.requests.length = 0;

    await loadVideo('dQw4w9WgXcQ');

    expect(youtube.requests).not.toContain('sw.js_data.txt');
  });
});
