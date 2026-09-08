# Codekunde fork — maintenance notes

This repository is an independent, hard fork of the archived
[buttercup/buttercup-browser-extension](https://github.com/buttercup/buttercup-browser-extension).
Codekunde maintains it going forward: all releases, version tags and store
listings originate from Codekunde and are **not** continuations of the upstream
project's releases.

## Extension identity

| Field | Value | Where |
| --- | --- | --- |
| Display name | `Buttercup (Codekunde)` | `resources/manifest.v2.json`, `resources/manifest.v3.json` |
| Homepage | `https://github.com/codekunde/buttercup-browser-extension` | both manifests |
| Firefox add-on ID | `{245ac273-f695-41d0-836f-ffe171c92cce}` | `resources/manifest.v2.json` → `browser_specific_settings.gecko.id` |

The Firefox ID was generated fresh for this fork. There is **no upstream
Firefox/AMO listing, signing key, or add-on ID inherited from Buttercup** — the
original `{10e7d273-…}` ID belonged to the upstream project and must never be
reused here. If/when this fork is submitted to AMO it will be a brand-new
listing under the ID above.

## Store listings — not yet claimed

There are currently no Codekunde store listings. Before publishing:

- **Chrome Web Store / Edge Add-ons**: new listings required. The upstream
  Chrome item (`heflipieckodmcppbnembejjmabajjjj`) is not ours.
- **Firefox AMO**: new listing under the fork's `gecko.id`.
- Update the README badges (still pointing at upstream store items) once real
  listings exist.

## Dependency strategy

- **buttercup-core**: consumed from `github:codekunde/buttercup-core#master`
  (our fork). Pin to a tag/commit before cutting a release.
- **@buttercup/locust**: still consumed from the published npm release, pinned
  to exact `2.3.1`. A preservation mirror lives at
  [codekunde/locust](https://github.com/codekunde/locust). Only switch the
  dependency to the fork when we actually need to patch form detection — at
  which point the fork needs a `prepare` build script (its npm package ships
  `dist/` only) or a republish under a Codekunde npm scope.

## Toolchain

- Node 20+ required. The webpack config uses `import ... with { type: "json" }`,
  so Node 20.10+ / 22 / 24 are all fine.
- `build:*` / `dev:*` scripts use `cross-env`, so they run on Windows as well as
  macOS/Linux.
- `release:*` scripts still assume a POSIX shell (`zip`, `mv`). Run releases
  from Git Bash / WSL / CI until these are ported.
