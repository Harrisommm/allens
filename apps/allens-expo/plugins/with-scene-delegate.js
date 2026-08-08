const { withAppDelegate } = require('expo/config-plugins');

const MARKER = '// allens: UIScene adoption';

/**
 * iOS 27 hard-crashes any app that doesn't adopt the UIScene lifecycle
 * (_UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption → SIGTRAP at
 * launch). Expo SDK 54 / RN 0.81 still use the legacy app-delegate lifecycle,
 * and declaring UIApplicationSceneManifest alone is not enough — UIKit wants a
 * real scene delegate.
 *
 * ExpoAppDelegate already creates the window and mounts React Native into it,
 * so this delegate adopts that window instead of building a second one.
 *
 * Delete this plugin once Expo ships UIScene support.
 */
const SCENE_DELEGATE = `
${MARKER}
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }

    // didFinishLaunching has already run, so React Native is mounted in the
    // app delegate's window. Re-parent it rather than replacing it.
    let existing = (UIApplication.shared.delegate as? AppDelegate)?.window
    let window = existing ?? UIWindow(windowScene: windowScene)
    window.windowScene = windowScene
    self.window = window
    window.makeKeyAndVisible()
  }
}
`;

module.exports = function withSceneDelegate(config) {
  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.contents.includes(MARKER)) return cfg;
    cfg.modResults.contents += SCENE_DELEGATE;
    return cfg;
  });
};
