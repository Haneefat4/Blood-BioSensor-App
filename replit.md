# Blood Biosensor

Local-only Expo SDK 54 app for logging glucose, hemoglobin, cholesterol, and platelet numbers you already have. It is a personal log, not a medical device.

Data stays in AsyncStorage on the device. There is no account and no API server. Store builds use EAS (`eas.json`). Day-to-day development is `npm run expo:dev` or `npx expo start`.

Reference ranges live in `client/lib/referenceRanges.ts` and need clinician review before anyone treats them as guidance.
