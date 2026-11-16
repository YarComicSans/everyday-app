// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

// Only the youtube service talks to YouTube, so a YouTube breakage is fixed in one place.
const YOUTUBE_SERVICE = ['src/services/youtube/**', 'scripts/record-youtube-fixtures.mjs'];

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    ignores: YOUTUBE_SERVICE,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [{ name: 'youtubei.js', message: 'Use the youtube service (@/services/youtube).' }],
          patterns: [
            { group: ['youtubei.js/*'], message: 'Use the youtube service (@/services/youtube).' },
          ],
        },
      ],
    },
  },
]);
