# Campus data ownership

Canonical public UTM campus facts and geometry live in `Gapwise-for-UTM/gapwise-data` under `data/utm`.

`gapwise` vendors and validates a build-time snapshot of that dataset and remains responsible for deterministic routing, gap-planning, API, SDK, and product semantics. `gapwise-mobile` should consume those stable Gapwise contracts and native product semantics rather than copying or independently maintaining building, entrance, footprint, or routing-graph facts.

## Rules for this repository

- Do not create a second UTM building/entrance/routing dataset here when the information belongs in `gapwise-data`.
- Prefer Gapwise API/SDK contracts for machine-readable campus intelligence.
- Native-only presentation or device integration belongs here; campus facts do not.
- Do not make the mobile app fetch `data.gapwise.ca` or GitHub as a required runtime dependency.
- A campus-fact change starts in `gapwise-data`; an API/calculation change starts in `gapwise`.

The machine-readable ecosystem contract in `gapwise.ecosystem.json` records the same ownership boundary and canonical GitHub organization.
