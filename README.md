# Blood Biosensor

Blood Biosensor is a local-only personal log for numbers you already have, such as glucose, hemoglobin, cholesterol, and platelets. It is not a medical device and it does not diagnose or interpret results.

Readings, medications, reminders, photos, and preferences stay on the device in AsyncStorage. There is no account and no server.

## Run locally

```bash
npm install
npx expo start
```

Then open the project in Expo Go, a simulator, or `w` for web. On Replit, `npm run expo:dev` starts Metro the same way the workspace workflow does.

Checks used before a release:

```bash
npx tsc --noEmit
npx eslint .
npm test
npx expo-doctor
npx expo export
```

## Bundle identifier

`com.owner.bloodbiosensor` in `app.json` (`ios.bundleIdentifier` and `android.package`) is a placeholder. Replace `owner` with the domain or organization that matches the Apple Developer and Google Play accounts before any store build:

`com.<owner>.bloodbiosensor`

Example: a company that owns `example.com` would use `com.example.bloodbiosensor`. The same id should be used on iOS and Android unless the accounts require otherwise. Change it in `app.json` only, then create the app records in App Store Connect and Play Console with that exact id.

## Version

`expo.version` is `1.0.0` (the user-facing version). `ios.buildNumber` is `1` and `android.versionCode` is `1`. Production EAS builds set `appVersionSource` to `local` and `autoIncrement`, so each store build bumps the build number and version code in `app.json`. Bump `expo.version` yourself when you ship a new user-facing release.

## Icons and splash

These paths are set in `app.json` and the files are present:

| Asset | Setting | Size |
| --- | --- | --- |
| `assets/images/icon.png` | `expo.icon` | 1024×1024 |
| `assets/images/splash-icon.png` | splash plugin, contain, 200pt, `#2563EB`, dark `#1F2937` | 1024×1024 |
| `assets/images/favicon.png` | web favicon | 1024×1024 |
| `assets/images/android-icon-foreground.png` | adaptive foreground | 1024×1024 |
| `assets/images/android-icon-background.png` | adaptive background | 512×512 |
| `assets/images/android-icon-monochrome.png` | Android 13 themed icon | 432×432 |

No referenced asset is missing. Before submission, confirm on a device that the adaptive icon stays inside the safe zone. Expo’s current guidance for adaptive layers is 1024×1024; the background image is 512×512 and the monochrome image is 432×432, so replace those two if a device preview looks soft or clipped.

## Build with EAS

Install the CLI and sign in once: `npm install -g eas-cli` then `eas login`. Link this repo with `eas init` (that writes the EAS project id). Profiles in `eas.json`:

- **development** — internal build. iOS simulator binary and an Android APK. This profile does not use a custom dev client, so day-to-day coding still uses Expo Go.
- **preview** — internal distribution for testers (Android APK; iOS device build using your internal provisioning).
- **production** — store binaries. Build numbers increment automatically.

```bash
eas build --profile preview --platform android
eas build --profile production --platform all
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

`eas submit` needs the Apple and Google credentials you create in the developer consoles. The empty `submit.production` block is where store-specific fields (Apple ID, ASC app id, Play service account) go once those accounts exist.

## Privacy policy URL

Host `docs/index.html` (same text as `docs/privacy-policy.md`) at a public HTTPS URL. GitHub Pages can serve the `docs/` folder on the default branch. Put that URL in App Store Connect and Play Console. Replace `privacy@example.com` in all three places before you publish the page:

- `docs/privacy-policy.md`
- `docs/index.html`
- `client/content/legalCopy.ts` (`PRIVACY_CONTACT_EMAIL`)

## Pre-launch checklist

Only the publisher can do these:

- [ ] Apple Developer Program and Google Play Console accounts, with agreements and tax forms accepted
- [ ] Replace `com.owner.bloodbiosensor` with the final bundle id and create the store listings with that id
- [ ] Run `eas init` and confirm the production profile builds on both platforms
- [ ] Host the privacy policy and paste the URL into both store listings and the App Privacy / Data safety forms (declare that data is not collected)
- [ ] Confirm `ITSAppUsesNonExemptEncryption` is still accurate (the app only uses standard platform encryption)
- [ ] Have a clinician sign off on the numbers in `client/lib/referenceRanges.ts` before anyone treats them as guidance
- [ ] On a real iPhone and Android phone: notifications, camera, photo library, and the first-launch notice
- [ ] Confirm the microphone prompt does not appear
- [ ] Capture store screenshots (phone and, if you ship it, tablet) and a short description that calls this a personal log, not a medical device
- [ ] Replace the contact email, support URL, and age rating answers
- [ ] Read the exported PDF and CSV once with a note that contains `<` and quotes
