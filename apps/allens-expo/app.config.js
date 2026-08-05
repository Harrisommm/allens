// EAS Build only uploads git-tracked files, and the Firebase config files are
// gitignored (this repo is public). They live on EAS as secret file env vars,
// which the builder materialises and exposes as a path. Locally those vars are
// unset and the files sitting next to this config are used instead.
//
// Everything else still comes from app.json — this only overrides two paths.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
  ios: {
    ...config.ios,
    googleServicesFile: process.env.GOOGLE_SERVICE_INFO_PLIST ?? config.ios.googleServicesFile,
  },
});
