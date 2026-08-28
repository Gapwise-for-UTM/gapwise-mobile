# Gapwise Mobile release readiness

This file separates credential-free engineering from owner-only distribution steps. Do not mark a store/signing step complete without direct evidence from the relevant platform.

## Credential-free release gates

Before any signed build is trusted, the exact source commit must pass:

- `npm ci --no-audit --no-fund`
- `npx expo install --check`
- `npm run typecheck`
- `npm test`
- `npm run format:check`
- `npm run audit:source`
- `npm run audit:release`
- `npm audit --omit=dev --audit-level=high`
- `npx expo-doctor@latest`
- iOS and Android Expo exports
- export privacy/size audit
- release provenance manifest generation
- unsigned native iOS and Android compilation, including the Android pre-35 RSA-OAEP-SHA256 interoperability test

Release provenance must identify the exact git SHA. Production API configuration is fixed to `https://api.gapwise.ca/v1`.

## EAS profiles

- `development`: internal development-client builds, development environment/channel.
- `preview`: internal distribution, preview environment/channel, Android APK for direct sideloading.
- `ios-simulator`: preview-derived unsigned iOS Simulator build.
- `production`: store distribution, production environment/channel, remote build-version source with auto-increment.

Every cloud build requires a committed source revision. App runtime compatibility uses the `appVersion` runtime policy so an update cannot target a different native app version.

EAS Update transport is **not enabled until an Expo project is actually linked**. When the project is linked, run the official EAS Update configuration flow, review the generated `extra.eas.projectId` and `updates.url`, and keep `npm run audit:release` green. Never invent a project id or update URL.

## iPhone QA checklist

Credential-free:

1. Keep Mobile CI and unsigned native iOS compilation green on the exact release commit.
2. Use the `ios-simulator` EAS profile once an Expo project is linked; this does not prove physical-device signing.
3. Verify startup, Today, timetable, campus browsing/routing, offline/reconnect behavior, share sheet, auth callback rejection/acceptance, encrypted restore failure preservation, sign-out, dynamic text, VoiceOver focus order, and diagnostics revision metadata.

Owner-only physical-device gate:

1. Enroll in the Apple Developer Program when ready for TestFlight/App Store distribution.
2. Link the Expo/EAS project and authenticate Apple credentials through EAS/Apple. Complete any Apple 2FA yourself.
3. Register the test device if using ad-hoc/internal distribution.
4. Build from an exact green commit and verify the EAS build reports that commit.
5. Install on the iPhone and repeat the physical-phone QA checklist.
6. Only then upload/use TestFlight or submit to App Store Connect.

Do not accept paid agreements, legal terms, or account ownership changes on someone else's behalf.

## Android QA checklist

Credential-free/local:

1. Keep Mobile CI and unsigned native Android compilation green on the exact release commit.
2. Run the app on an Android emulator or sideload a locally built debug/preview APK when available.
3. Verify startup, Today, timetable persistence, campus cache clear/reload, offline routing state, share sheet, auth/deep-link behavior, encrypted restore preservation, TalkBack focus order, and diagnostics revision metadata.

Cloud/internal build after Expo project link:

1. Build `preview` for Android to obtain a sideloadable APK.
2. Confirm the build's git commit matches the intended green revision.
3. Install on a real Android phone and repeat the checklist above.
4. Production Google Play distribution remains owner-only: create the Play Console account, complete identity/legal steps, then build the `production` AAB and upload it to the desired test/release track.

## Final security dependency

Mobile store release readiness is not complete until the cross-ecosystem invisible-security audit (Linear AND-143) has evidence and there is no known high/critical security defect. An Apple, Google, or EAS credential gate is operational only and must never be used as a reason to weaken encryption, auth isolation, privacy, or CI checks.
