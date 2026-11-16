/**
 * Expo config plugin: white ±10s icons in expo-video's Android media notification.
 *
 * expo-video's playback service (background playback) shows seek buttons whose
 * vector drawables are filled with ?android:attr/colorControlNormal, which renders
 * dark on the notification while the other controls are white.
 *
 * Android resource merging lets an app-level drawable override a library drawable
 * of the same name, so this writes white copies of those drawables into the app's
 * res/drawable. expo-video itself is not patched.
 *
 * Verified against expo-video 58.0.14: ExpoVideoPlaybackService.kt uses
 * R.drawable.seek_forwards_10s and R.drawable.seek_backwards_10s for the seek
 * buttons, defined in android/src/main/res/drawable/. The drawables are copied
 * from the installed expo-video at prebuild time, so the shapes stay in sync;
 * if expo-video renames them, prebuild fails here instead of silently doing nothing.
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const DRAWABLE_NAMES = ['seek_forwards_10s', 'seek_backwards_10s'];
const WHITE = '#FFFFFFFF';

function readLibraryDrawable(projectRoot, name) {
  const pkgJson = require.resolve('expo-video/package.json', { paths: [projectRoot] });
  const file = path.join(path.dirname(pkgJson), 'android/src/main/res/drawable', `${name}.xml`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `[video-seek-icons] expo-video no longer ships drawable "${name}" (${file}). ` +
        'Check ExpoVideoPlaybackService.kt for the new seek icon names.',
    );
  }
  return fs.readFileSync(file, 'utf8');
}

function whiten(xml) {
  return xml.replace(/android:fillColor="[^"]*"/g, `android:fillColor="${WHITE}"`);
}

module.exports = function withVideoSeekIcons(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const drawableDir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/drawable');
      fs.mkdirSync(drawableDir, { recursive: true });
      for (const name of DRAWABLE_NAMES) {
        const xml = whiten(readLibraryDrawable(cfg.modRequest.projectRoot, name));
        fs.writeFileSync(path.join(drawableDir, `${name}.xml`), xml);
      }
      return cfg;
    },
  ]);
};
