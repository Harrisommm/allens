const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = '# allens: raise pod deployment targets';

/**
 * Xcode 27 refuses to build any target below iOS 15.0, but several transitive
 * pods still declare 9.0–13.4 on their generated resource-bundle targets
 * (GoogleUtilities_Privacy, FBLPromises_Privacy, AppAuthCore_Privacy, …).
 * expo-build-properties' `deploymentTarget` sets the app platform and doesn't
 * reach those, so the build fails before it compiles a line of our code.
 *
 * `prebuild` regenerates the Podfile from a template, so this has to be applied
 * as a plugin rather than edited in place.
 */
module.exports = function withPodDeploymentTarget(config, { deploymentTarget = '15.5' } = {}) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      const contents = fs.readFileSync(podfile, 'utf8');
      if (contents.includes(MARKER)) return cfg;

      const patched = contents.replace(
        /^(\s*)(react_native_post_install\()/m,
        [
          `$1${MARKER}`,
          `$1installer.pods_project.targets.each do |target|`,
          `$1  target.build_configurations.each do |build_configuration|`,
          `$1    build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'`,
          `$1  end`,
          `$1end`,
          `$1$2`,
        ].join('\n')
      );

      if (patched === contents) {
        throw new Error('with-pod-deployment-target: could not find react_native_post_install in the Podfile');
      }

      fs.writeFileSync(podfile, patched);
      return cfg;
    },
  ]);
};
