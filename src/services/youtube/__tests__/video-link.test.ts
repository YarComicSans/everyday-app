import { parseVideoLink } from '..';

const ID = 'dQw4w9WgXcQ';

describe('parseVideoLink', () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `http://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}`,
    `www.youtube.com/watch?v=${ID}`,
    `youtube.com/watch?v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `m.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com/watch?feature=share&v=${ID}&list=PL123`,
    `https://youtu.be/${ID}`,
    `youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=AbCdEf123`,
    `https://youtu.be/${ID}/`,
    `https://youtu.be/${ID}/?si=AbCdEf123`,
    `https://www.youtube.com/shorts/${ID}`,
    `youtube.com/shorts/${ID}?feature=share`,
    `  https://youtu.be/${ID}  `,
  ])('reads the video ID from %s', (text) => {
    expect(parseVideoLink(text)).toEqual({ videoId: ID });
  });

  it.each([
    [`https://www.youtube.com/watch?v=${ID}&t=90`, 90],
    [`https://www.youtube.com/watch?v=${ID}&t=90s`, 90],
    [`https://youtu.be/${ID}?t=1h2m3s`, 3723],
    [`https://youtu.be/${ID}?t=2m13s`, 133],
    [`https://youtu.be/${ID}?si=xyz&t=45s`, 45],
    [`m.youtube.com/watch?t=1h&v=${ID}`, 3600],
    [`youtube.com/shorts/${ID}?t=5`, 5],
    [`https://youtu.be/${ID}?t=1m30`, 90],
    [`https://youtu.be/${ID}?t=1h0m5`, 3605],
    [`https://youtu.be/${ID}/?t=45`, 45],
  ])('reads the start time from %s', (text, startAt) => {
    expect(parseVideoLink(text)).toEqual({ videoId: ID, startAt });
  });

  it.each([
    [`https://youtu.be/${ID}?t=`],
    [`https://youtu.be/${ID}?t=abc`],
    [`https://youtu.be/${ID}?t=0`],
  ])('ignores an unusable t= in %s', (text) => {
    expect(parseVideoLink(text)).toEqual({ videoId: ID });
  });

  it.each([
    'lofi hip hop',
    '',
    'youtube',
    `${ID}`,
    `https://vimeo.com/watch?v=${ID}`,
    `https://notyoutube.com/watch?v=${ID}`,
    `https://youtube.com.evil.example/watch?v=${ID}`,
    'https://www.youtube.com/watch',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw',
    'https://www.youtube.com/playlist?list=PL123',
    'https://youtu.be/',
    `https://www.youtube.com/shorts/${ID}extra`,
    `watch this https://youtu.be/${ID}`,
  ])('returns null for %p', (text) => {
    expect(parseVideoLink(text)).toBeNull();
  });
});
