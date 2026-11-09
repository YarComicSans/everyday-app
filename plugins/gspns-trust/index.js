/**
 * Expo config plugin: let Android trust www.gspns.rs.
 *
 * gspns.rs serves leaf -> "Sectigo Public Server Authentication CA DV R36",
 * which chains to "Sectigo Public Server Authentication Root R46" (2021).
 * Older Android trust stores lack R46 and Android does not fetch the
 * cross-signed certificate, so TLS fails with
 * "Trust anchor for certification path not found".
 *
 * This bundles the R46 root (SHA-256 7B:B6:47:A6:...:5A:06) and trusts it
 * only for gspns.rs via a network security config. Other domains are unchanged.
 */
const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const CERT_SOURCE = path.join(__dirname, 'sectigo_public_server_authentication_root_r46.pem');
const CERT_RES_NAME = 'sectigo_public_server_authentication_root_r46';
const CONFIG_RES_NAME = 'network_security_config';

// When networkSecurityConfig is set, Android ignores android:usesCleartextTraffic,
// so debug variants get their own copy that still allows plain HTTP to Metro.
const networkSecurityConfig = ({ allowCleartext }) => `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>${allowCleartext ? '\n  <base-config cleartextTrafficPermitted="true" />' : ''}
  <domain-config>
    <domain includeSubdomains="true">gspns.rs</domain>
    <trust-anchors>
      <certificates src="system" />
      <certificates src="@raw/${CERT_RES_NAME}" />
    </trust-anchors>
  </domain-config>
</network-security-config>
`;

function withGspnsTrustFiles(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const srcDir = path.join(cfg.modRequest.platformProjectRoot, 'app/src');
      const rawDir = path.join(srcDir, 'main/res/raw');
      fs.mkdirSync(rawDir, { recursive: true });
      fs.copyFileSync(CERT_SOURCE, path.join(rawDir, `${CERT_RES_NAME}.pem`));

      for (const [variant, allowCleartext] of [
        ['main', false],
        ['debug', true],
        ['debugOptimized', true],
      ]) {
        const xmlDir = path.join(srcDir, variant, 'res/xml');
        fs.mkdirSync(xmlDir, { recursive: true });
        fs.writeFileSync(
          path.join(xmlDir, `${CONFIG_RES_NAME}.xml`),
          networkSecurityConfig({ allowCleartext }),
        );
      }
      return cfg;
    },
  ]);
}

function withGspnsTrustManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app) {
      app.$['android:networkSecurityConfig'] = `@xml/${CONFIG_RES_NAME}`;
    }
    return cfg;
  });
}

module.exports = function withGspnsTrust(config) {
  return withGspnsTrustManifest(withGspnsTrustFiles(config));
};
