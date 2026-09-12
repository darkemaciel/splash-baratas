# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Baratas na Geladeira" — a browser game where cockroaches spawn and move toward specific food items on fridge shelves; the player clicks roaches to eliminate them before they reach their target food. See `prd.md` for the full product spec (in Portuguese). Key constraints from the PRD:

- **MVP scope**: single loss condition (all food items stolen), no scoring, no progressive difficulty, no backend — all match state lives client-side.
- **Stack**: TypeScript + Phaser 4, Bun as package manager/runtime, Vite for bundling, static deploy target (Vercel).
- **Performance is a hard requirement**: stable 60 FPS and near-zero input latency are critical, since roach hitbox accuracy depends on render/collision positions staying in sync. Avoid heavy physics for click detection — direct hit-testing is expected.
- **Input**: must use pointer events (not mouse-only), since a future mobile/touch port is anticipated even though mobile is out of scope for this MVP.
- Target browsers: current Chrome, Firefox, Edge; desktop resolutions only.

Technical principles are ratified in `.specify/memory/constitution.md` (7 principles: domain/render separation, client-as-untrusted-single-layer, web-first/mobile-later via Pointer Events, deliberate MVP simplicity, non-negotiable click responsiveness, versioned assets, fixed stack).

**Status: MVP implemented.** The main loop (spec `specs/001-roach-fridge-clicker/`) is fully built and all its tasks are complete:

- `client/src/entities/` — `FoodItem`, `Shelf`, `Roach`, `Match` (pure TypeScript, no `phaser` import, per constitution Principle I)
- `client/src/systems/` — `MatchStateManager` (spawn/steal/eliminate/restart, `EventTarget`-based pub-sub) and `CollisionSystem` (direct geometry hit-testing, no physics engine)
- `client/src/scenes/` — `BootScene`, `StartScene`, `GameScene`, `GameOverScene` (Phaser), the only consumers of `systems/`
- `client/src/config/gameConfig.ts` — fixed constants (spawn interval, travel duration, hitbox padding, shelf/food counts)
- `client/tests/unit/` — `bun test` suite covering the domain layer in isolation
- Placeholder sprites in `client/public/assets/sprites/`

Any new feature (progressive difficulty, scoring, sound, HUD, etc. — tracked in `backlog.md`) should land as a **new spec** via `/speckit-specify`, not a retroactive edit to `specs/001-roach-fridge-clicker/`, per constitution Principle IV.

## Specs

Full spec-kit artifacts for the implemented feature live in `specs/001-roach-fridge-clicker/`: `spec.md` (22 functional requirements, 3 prioritized user stories, 6 success criteria), `plan.md`, `research.md`, `data-model.md`, `contracts/domain-api.md`, `quickstart.md`, `checklists/requirements.md`, and `tasks.md` (36/36 tasks done).

## Commands

All commands run from `client/` (the only workspace in this repo):

```bash
bun install          # install dependencies
bun run dev          # start the Vite dev server (the actual game)
bun run build        # production build (static output for Vercel)
bun test             # run the unit test suite (entities/ and systems/)
```

## Notes

- The repo root previously had an untracked SSH keypair generated accidentally in the working directory; it is no longer present. If one reappears, do not commit it and flag it to the user.
