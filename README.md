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

**[Gapwise](https://gapwise.ca)** · **[API](https://api.gapwise.ca/v1)** · **[Data](https://data.gapwise.ca)** · **[AI](https://ai.gapwise.ca)** · **[Docs](https://docs.gapwise.ca)** · **[Status](https://status.gapwise.ca)** · **[OpenAPI](https://api.gapwise.ca/openapi.json)**

</div>

---

## What Gapwise Mobile is

Gapwise Mobile is the first-party native client for the Gapwise ecosystem. It brings the same deterministic timetable, gap-planning, campus-routing, privacy, and data-integrity model from the web product to iPhone and Android without creating a second source of truth.

The mobile client is intentionally **not a WebView wrapper**. It is built with Expo and React Native, uses the canonical Gapwise APIs and contracts, and is designed around physical-phone use: fast launch, touch-first navigation, safe areas, offline/reconnect behavior, native sharing, secure credential storage, accessibility, and cloud-distributed builds.

Gapwise Mobile is one part of a **six-repository campus-intelligence ecosystem** spanning the core web/PWA and public API, this native client, permissioned AI/MCP, open campus data and provenance, developer documentation, independent status/incident communication, and published JavaScript/TypeScript and Python SDKs from the core repository.

The architectural rule stays the same as the main product:

> **Gapwise owns the facts and deterministic calculations. Interfaces — web, mobile, API, SDKs, data, AI, docs, and status — consume, expose, explain, or monitor that truth rather than recreating it.**

---

## Mobile experience

The finished client is structured around four primary surfaces:

| Surface       | Purpose                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------- |
| **Today**     | Current/next class context, active gap, leave-by timing, route state, and actionable day planning |
| **Timetable** | Native schedule browsing, academic meetings, personal plans, and between-class gap context        |
| **Campus**    | UTM places, campus intelligence, route presentation, and route-aware gap decisions                |
| **More**      | Account, export/share, AI integrations, diagnostics, privacy, accessibility, and settings         |

Core functionality remains guest-first. The mobile app should be useful without requiring an account, while optional signed-in continuity uses the existing Gapwise privacy and restoration model.

---

## Canonical Gapwise sources

The mobile repository deliberately reuses the established Gapwise product rather than forking its semantics.

- **Primary product:** [`andrewmuratov/gapwise`](https://github.com/andrewmuratov/gapwise)
- **Campus/API truth:** [api.gapwise.ca/v1](https://api.gapwise.ca/v1)
- **OpenAPI contract:** [api.gapwise.ca/openapi.json](https://api.gapwise.ca/openapi.json)
- **Published JavaScript/TypeScript SDK:** `@gapwise/sdk@0.1.1` on npm and JSR
- **Published Python SDK:** `gapwise==0.1.0` on PyPI
- **Campus-data provenance:** [data.gapwise.ca](https://data.gapwise.ca)
- **Developer docs:** [docs.gapwise.ca](https://docs.gapwise.ca)
- **AI/MCP boundary:** [`andrewmuratov/gapwise-ai`](https://github.com/andrewmuratov/gapwise-ai)
- **Operational state:** [status.gapwise.ca](https://status.gapwise.ca)
- **Brand mark:** [`andrewmuratov/gapwise/public/logo-mark.svg`](https://github.com/andrewmuratov/gapwise/blob/main/public/logo-mark.svg)
- **Visual system:** [`andrewmuratov/gapwise/src/styles.css`](https://github.com/andrewmuratov/gapwise/blob/main/src/styles.css)

The checked-in file [`assets/brand/logo-mark.svg`](assets/brand/logo-mark.svg) is the official Gapwise deer mark. Do not redraw, approximate, or replace it with generated branding.

The registry SDKs are intended for third-party/public-platform consumers and contract validation; the native app remains free to use its purpose-built mobile client layer as long as it consumes the same canonical v1 semantics rather than inventing a divergent API model.

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
- AI integration remains explicitly permissioned and cannot silently rewrite official academic meetings;
- private AI client support remains evidence-gated: the AI service's broad-client release checklist is not treated as complete until the real-client OAuth/read/write/revoke matrices pass.

For the broader trust model, see the main Gapwise [`SECURITY.md`](https://github.com/andrewmuratov/gapwise/blob/main/SECURITY.md), [`PRIVACY.md`](https://github.com/andrewmuratov/gapwise/blob/main/PRIVACY.md), and the Gapwise AI [`SECURITY.md`](https://github.com/andrewmuratov/gapwise-ai/blob/main/SECURITY.md).

---

## Delivered roadmap

Mobile development is tracked under the Linear project **Gapwise — Mobile**. The repository now contains the implementation and release-hardening work from all six planned phases; future changes should preserve the same source-of-truth, privacy, accessibility, and release-safety boundaries.

1. **Foundation** — Expo/React Native bootstrap, design system, navigation, diagnostics, and CI.
2. **Student day** — Today, timetable, gap planning, local persistence, and offline-first restoration.
3. **Campus** — places, map intelligence, routing, and offline-aware campus data.
4. **Account continuity** — authentication, secure storage, guest-to-account restoration, and account isolation.
5. **Polish** — export/share, AI surfaces, accessibility, performance, and unified states.
6. **Distribution** — EAS builds, TestFlight/internal Android distribution, OTA safety, and release hardening.

App Store / Google Play account enrollment, signing agreements, paid developer programs, and final store submission remain explicit owner-controlled steps.

---

## Development

The project uses the Expo toolchain. The checked-in EAS configuration provides development-client, preview, iOS-simulator, and production build profiles so native and release behavior can be tested without treating Expo Go as the production runtime.

To run the project locally:

```bash
git clone https://github.com/andrewmuratov/gapwise-mobile.git
cd gapwise-mobile
npm install
npx expo start
```

The repository includes project-local automation plus EAS development, preview, simulator, and production profiles. Cloud submission remains an explicit release action rather than a one-click development command.

---

## Verification

Credential-free CI covers the checks that can run without Apple or Google signing credentials, including:

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

## Gapwise ecosystem

The six first-party repositories are separate deployment/execution surfaces with one product identity, trust model, and source-of-truth hierarchy:

- **[`gapwise`](https://github.com/andrewmuratov/gapwise)** — core web/PWA product, canonical student-state behavior, deterministic UTM campus intelligence, public API, OpenAPI contract, and published SDK source; [gapwise.ca](https://gapwise.ca) / [api.gapwise.ca](https://api.gapwise.ca/v1).
- **[`gapwise-mobile`](https://github.com/andrewmuratov/gapwise-mobile)** — native iOS and Android client consuming canonical Gapwise contracts and product semantics.
- **[`gapwise-ai`](https://github.com/andrewmuratov/gapwise-ai)** — permissioned OAuth/MCP layer for explicitly delegated student context and bounded AI actions; [ai.gapwise.ca](https://ai.gapwise.ca).
- **[`gapwise-data`](https://github.com/andrewmuratov/gapwise-data)** — open campus-data, provenance, schema, validation, and reuse portal; [data.gapwise.ca](https://data.gapwise.ca).
- **[`gapwise-docs`](https://github.com/andrewmuratov/gapwise-docs)** — canonical public developer documentation for the platform, SDKs, security, data, and AI/MCP integration; [docs.gapwise.ca](https://docs.gapwise.ca).
- **[`gapwise-status`](https://github.com/andrewmuratov/gapwise-status)** — independent service-health monitoring and incident communication; [status.gapwise.ca](https://status.gapwise.ca).

`gapwise` remains authoritative for deterministic timetable, gap, campus, routing, public API, SDK, and primary student-state semantics. Mobile consumes those contracts natively; Data explains the evidence behind campus truth; AI exposes explicitly delegated context through a separate trust boundary; Docs describes released behavior; and Status communicates operational state independently.

All six repositories should keep branding, security language, trust boundaries, terminology, release state, and cross-links consistent.

---

## Project relationship

Gapwise is an independent project created by Andrew Muratov. It is not an official University of Toronto service and is not affiliated with or endorsed by the University of Toronto.
