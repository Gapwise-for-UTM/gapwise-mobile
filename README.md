<div align="center">

<img src="assets/brand/logo-mark.svg" width="116" alt="Gapwise deer mark" />

# Gapwise Mobile

### Gapwise, built for your phone.

**The native iOS and Android client for Gapwise — timetable, Today, campus intelligence, routing, gap planning, exports, and permissioned AI in a student-first mobile experience.**

[![Gapwise](https://img.shields.io/badge/Gapwise-0A84FF?style=for-the-badge&logo=vercel&logoColor=white)](https://gapwise.ca)
[![iOS + Android](https://img.shields.io/badge/iOS_%2B_Android-Native-111111?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/andrewmuratov/gapwise-mobile)
[![Expo](https://img.shields.io/badge/Expo-React_Native-111111?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)

<sub>Expo · React Native · TypeScript · Expo Router · Gapwise Platform</sub>

<br />

**[Gapwise](https://gapwise.ca)** · **[Main repository](https://github.com/andrewmuratov/gapwise)** · **[Developer docs](https://docs.gapwise.ca)** · **[OpenAPI](https://api.gapwise.ca/openapi.json)**

</div>

---

## What Gapwise Mobile is

Gapwise Mobile is the first-party native client for the Gapwise ecosystem. It brings the same deterministic timetable, gap-planning, campus-routing, privacy, and data-integrity model from the web product to iPhone and Android without creating a second source of truth.

The mobile client is intentionally **not a WebView wrapper**. It is built with Expo and React Native, uses the canonical Gapwise APIs and contracts, and is designed around physical-phone use: fast launch, touch-first navigation, safe areas, offline/reconnect behavior, native sharing, secure credential storage, accessibility, and cloud-distributed builds.

The architectural rule stays the same as the main product:

> **Gapwise owns the facts and deterministic calculations. Interfaces — web, mobile, API, and AI — consume that truth rather than recreating it.**

---

## Mobile experience

The finished client is structured around four primary surfaces:

| Surface | Purpose |
| --- | --- |
| **Today** | Current/next class context, active gap, leave-by timing, route state, and actionable day planning |
| **Timetable** | Native schedule browsing, academic meetings, personal plans, and between-class gap context |
| **Campus** | UTM places, campus intelligence, route presentation, and route-aware gap decisions |
| **More** | Account, export/share, AI integrations, diagnostics, privacy, accessibility, and settings |

Core functionality remains guest-first. The mobile app should be useful without requiring an account, while optional signed-in continuity uses the existing Gapwise privacy and restoration model.

---

## Canonical Gapwise sources

The mobile repository deliberately reuses the established Gapwise product rather than forking its semantics.

| Concern | Canonical source |
| --- | --- |
| **Brand mark** | [`andrewmuratov/gapwise/public/logo-mark.svg`](https://github.com/andrewmuratov/gapwise/blob/main/public/logo-mark.svg) |
| **Visual system** | [`andrewmuratov/gapwise/src/styles.css`](https://github.com/andrewmuratov/gapwise/blob/main/src/styles.css) |
| **Campus/API truth** | [Gapwise Platform](https://api.gapwise.ca/v1) |
| **OpenAPI contract** | [OpenAPI 3.1](https://api.gapwise.ca/openapi.json) |
| **Developer docs** | [docs.gapwise.ca](https://docs.gapwise.ca) |
| **Primary product** | [`andrewmuratov/gapwise`](https://github.com/andrewmuratov/gapwise) |

The checked-in file [`assets/brand/logo-mark.svg`](assets/brand/logo-mark.svg) is the official Gapwise deer mark. Do not redraw, approximate, or replace it with generated branding.

---

## Design system

Gapwise Mobile follows the same visual language as the main product while adapting it to native platform conventions:

- canonical Gapwise blue `#4EA7FE`;
- near-black/deep-navy dark surfaces and restrained blue-gray elevation;
- Geist-compatible typography with native system fallbacks where appropriate;
- continuous rounded geometry, subtle borders, and restrained glow;
- native safe-area behavior on iPhone and Android;
- dynamic type, VoiceOver/TalkBack support, large touch targets, and non-color status cues;
- reduced-motion behavior and subtle haptics where they improve, but never replace, essential feedback.

The goal is not pixel-for-pixel web duplication. The goal is for the app to feel unmistakably **Gapwise** while also feeling native to the device.

---

## Privacy and security

Gapwise Mobile inherits the main product's privacy-minimizing architecture and should not expand access merely because it is native.

Key rules:

- guest-first core functionality;
- no service-role key, OAuth client secret, private server key, or other privileged secret is shipped in the app;
- session material belongs in platform-appropriate secure storage;
- academic meetings remain authoritative and distinct from mutable plans;
- offline changes must not be silently lost or overwritten by empty cloud state;
- account switching must isolate user state correctly;
- campus/accessibility uncertainty must fail honestly rather than inventing route truth;
- AI integration remains explicitly permissioned and cannot silently rewrite official academic meetings.

For the broader trust model, see the main Gapwise [`SECURITY.md`](https://github.com/andrewmuratov/gapwise/blob/main/SECURITY.md) and [`PRIVACY.md`](https://github.com/andrewmuratov/gapwise/blob/main/PRIVACY.md).

---

## Development roadmap

Mobile development is tracked under the Linear project **Gapwise — Mobile** and is being delivered sequentially so each stage can be tested and reviewed before the next one changes the surface.

1. **Foundation** — Expo/React Native bootstrap, design system, navigation, diagnostics, and CI.
2. **Student day** — Today, timetable, gap planning, local persistence, and offline-first restoration.
3. **Campus** — places, map intelligence, routing, and offline-aware campus data.
4. **Account continuity** — authentication, secure storage, guest-to-account restoration, and account isolation.
5. **Polish** — export/share, AI surfaces, accessibility, performance, and unified states.
6. **Distribution** — EAS builds, TestFlight/internal Android distribution, OTA safety, and release hardening.

App Store / Google Play account enrollment, signing agreements, paid developer programs, and final store submission remain explicit owner-controlled steps.

---

## Development

The project uses the Expo toolchain and is designed to stay Expo Go-compatible until native-only functionality creates a concrete reason for a development client.

Once the Phase 1 application files land:

```bash
git clone https://github.com/andrewmuratov/gapwise-mobile.git
cd gapwise-mobile
npm install
npx expo start
```

The repository will also expose project-local Codex run actions and EAS development/preview/production profiles. Cloud submission actions are deliberately not one-click development commands.

---

## Verification

Credential-free CI is expected to cover the checks that can run without Apple or Google signing credentials, including:

```text
dependency install
→ typecheck
→ lint / format
→ tests
→ Expo Doctor / config validation
→ iOS bundle/export validation
→ Android bundle/export validation
```

Physical-device QA is performed separately from static CI. The app includes non-secret diagnostics so screenshots and bug reports can identify the exact app version, build/update channel, platform, environment, and commit without exposing credentials.

---

## Ecosystem

Gapwise Mobile is one surface of the larger Gapwise ecosystem:

- **[`gapwise`](https://github.com/andrewmuratov/gapwise)** — primary web/PWA product and deterministic UTM truth;
- **[`gapwise-mobile`](https://github.com/andrewmuratov/gapwise-mobile)** — native iOS and Android client;
- **[`gapwise-ai`](https://github.com/andrewmuratov/gapwise-ai)** — permissioned AI/MCP service;
- **[`gapwise-docs`](https://github.com/andrewmuratov/gapwise-docs)** — developer and platform documentation.

The repositories are separate deployment surfaces, but they should present one coherent product, brand, trust model, and source of truth.
