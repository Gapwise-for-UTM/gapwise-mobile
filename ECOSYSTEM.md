# Gapwise ecosystem integration

`gapwise-mobile` is the native iOS/Android client of the six-repository Gapwise ecosystem. It owns mobile UX, device integration, secure local persistence, offline/reconnect behavior, native accessibility, and app distribution. It does not own a second timetable, routing, gap-planning, campus-data, or public-API contract.

## Canonical dependencies

- Core product/API/SDK source: `andrewmuratov/gapwise`
- Public API: `https://api.gapwise.ca/v1`
- OpenAPI: `https://api.gapwise.ca/openapi.json`
- Data/provenance: `https://data.gapwise.ca`
- Developer docs: `https://docs.gapwise.ca`
- AI/MCP boundary: `https://ai.gapwise.ca/api/mcp`
- Operational status: `https://status.gapwise.ca`

## SDK/runtime state

Gapwise maintains two equal first-party SDK implementations in the core repository:

- TypeScript `@gapwise/sdk`: version `0.1.0` is released on both npm and JSR with provenance through trusted GitHub Actions publishing. The TypeScript implementation is portable across runtime targets rather than forked into Node, Bun, and Deno packages.
- Python `gapwise==0.1.0`: released on PyPI through Trusted Publishing.

The native app may keep a purpose-built mobile client layer where React Native constraints justify it, but request/response semantics, enums, uncertainty, routing states, and API behavior must match the same canonical v1 contract and both public SDKs.

## Mobile integration rules

1. Academic/source-backed timetable facts remain canonical and distinct from mutable personal plans.
2. Campus building/place identity follows the core/data source of truth; mobile caches may optimize delivery but may not redefine records.
3. Routing, gap feasibility, leave-by logic, and uncertainty semantics must remain aligned with core deterministic behavior.
4. AI access remains explicit and permissioned through `gapwise-ai`; mobile must not bypass OAuth/MCP boundaries with a privileged embedded secret.
5. Store/device capabilities never justify shipping service-role keys, OAuth client secrets, private signing material, or server-only credentials.
6. Public SDK registry state is developer-platform metadata; mobile distribution state is separate and must be evidence-based through actual TestFlight/Play/App Store releases.
7. Status links point to the independent status surface rather than duplicating operational truth in-app.

## Change impact

Before changing a mobile representation of a canonical concept, check:

- core `gapwise` behavior and OpenAPI;
- TypeScript and Python SDK types/examples;
- `gapwise-data` provenance/uncertainty rules;
- `gapwise-docs` released semantics;
- `gapwise-ai` delegated representation and mutation permissions;
- `gapwise-status` if a public mobile/backend dependency changes.

Mobile is an integrated first-party client, not an isolated implementation.
