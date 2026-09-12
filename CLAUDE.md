# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Baratas na Geladeira" — a browser game where cockroaches spawn and move toward specific food items on fridge shelves; the player clicks roaches to eliminate them before they reach their target food. See `prd.md` for the full product spec (in Portuguese). Key constraints from the PRD:

- **MVP scope**: single loss condition (all food items stolen), no scoring, no progressive difficulty, no backend — all match state lives client-side.
- **Stack**: TypeScript + Phaser 4, Bun as package manager/runtime, Vite for bundling, static deploy target (Vercel).
- **Performance is a hard requirement**: stable 60 FPS and near-zero input latency are critical, since roach hitbox accuracy depends on render/collision positions staying in sync. Avoid heavy physics for click detection — direct hit-testing is expected.
- **Input**: must use pointer events (not mouse-only), since a future mobile/touch port is anticipated even though mobile is out of scope for this MVP.
- Target browsers: current Chrome, Firefox, Edge; desktop resolutions only.

The actual game code has not been written yet — `client/src/{config,entities,scenes,systems,ui}` are currently empty scaffold directories. `prd.md` references a `constitution.md` for technical principles, but that file does not exist yet in this repo.

## Commands

All commands run from `client/` (the only workspace currently in this repo):

```bash
bun install          # install dependencies
bun run index.ts     # run the current entry point (placeholder script, not the game yet)
```

No build, lint, or test scripts are defined in `client/package.json` yet, and no test framework is configured. Vite is present as a dependency but no `vite.config.*` exists yet — bundler setup for the actual Phaser game is still pending.

## Notes

- Repo root currently has an untracked SSH keypair (`.pub` file and its private counterpart) that appears to have been generated accidentally in the working directory rather than `~/.ssh`. These are not part of the project — do not commit them, and flag to the user if they're still present, since the private key should not end up in git history.
