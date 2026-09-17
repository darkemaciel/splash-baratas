# Implementation Plan: Variação nos Pontos de Spawn

**Branch**: `010-variacao-pontos-spawn` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-variacao-pontos-spawn/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Substituir os 4 pontos fixos de spawn (`SPAWN_POINTS`/`nearestSpawnPoint` em `gameConfig.ts`) por 4
**regiões** de borda (topo/base/esquerda/direita), cada uma com 3 pontos candidatos fixos e
pré-definidos (12 pontos no total, contra 4 hoje). `MatchStateManager.tick()` continua escolhendo a
região pela mesma lógica de "âncora mais próxima do alvo" já usada hoje (preserva FR-003/US2), mas
dentro da região sorteia aleatoriamente qual dos 3 pontos usar (FR-004), evitando repetir o ponto do
spawn imediatamente anterior para o mesmo alvo quando há alternativa (FR-005). Nenhuma mudança em
`entities/` — `Roach.spawnPoint` continua sendo apenas um `Point`, a variação é inteiramente uma
decisão de `systems/MatchStateManager.ts` + `config/gameConfig.ts`.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Nenhuma dependência nova — reaproveita `Math.random()`, já usado por
`MatchStateManager.tick()` para escolher a comida-alvo de cada spawn (specs/001)

**Storage**: N/A — o único estado novo é bookkeeping efêmero (`lastSpawnPointByTarget`, um `Map` em
memória na instância de `MatchStateManager`, resetado a cada `start()`/`restart()`), no mesmo espírito
do já existente `lastSpawnAt`; não é um novo conceito de domínio persistido em `Match`

**Testing**: `bun test` cobre a nova lógica em `client/src/config/gameConfig.ts` (seleção de região e
de ponto dentro da região) e em `client/src/systems/MatchStateManager.ts` (regra de não-repetição),
seguindo o mesmo padrão de testes de invariante sob aleatoriedade real já usado para a escolha de
alvo em `matchStateManager.spawn.test.ts` (sem seed/mocking de `Math.random()`)

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalteradas (Princípio V); seleção
de ponto de spawn permanece O(1) (região) + sorteio sobre um array de 3 elementos — custo
insignificante face ao já existente sorteio de alvo por tick

**Constraints**: nenhuma mudança em `client/src/entities/` (Princípio I) — `Roach`/`positionAt`
continuam recebendo um único `Point` de spawn, sem saber que ele veio de um conjunto maior; a duração
de viagem (`TRAVEL_DURATION_MS`) e a cadência (`SPAWN_INTERVAL_MS`) permanecem intocadas (FR-006,
Assumptions do spec); todo novo ponto candidato deve continuar fora da área de prateleiras/comidas
(FR-002), garantido por construção ao defini-los como frações de `GAME_WIDTH`/`GAME_HEIGHT` fora do
intervalo `[0, GAME_WIDTH]`/`[0, GAME_HEIGHT]`, no mesmo padrão dos 4 pontos atuais

**Scale/Scope**: edições em `client/src/config/gameConfig.ts` (substitui `SPAWN_POINTS`/
`nearestSpawnPoint` por `SPAWN_POINTS_BY_REGION`/`nearestSpawnRegion`/`pickSpawnPoint`) e em
`client/src/systems/MatchStateManager.ts` (usa as novas funções + `lastSpawnPointByTarget`); nenhum
arquivo novo em `entities/`/`scenes/`; alguns testes novos em `client/tests/unit/`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | Toda a mudança fica em `config/`+`systems/`, camadas puras sem `import Phaser`; `entities/Roach.ts` permanece intocado — continua recebendo só um `Point` | PASS |
| II. Cliente como única camada, tratado como não confiável | `lastSpawnPointByTarget` é bookkeeping interno de `MatchStateManager`, no mesmo padrão de `lastSpawnAt` — não introduz estado espalhado em `scenes/` | PASS |
| III. Web-first, mobile depois | Nenhuma mudança de input; pontos de spawn continuam definidos como frações de `GAME_WIDTH`/`GAME_HEIGHT`, coerentes com o suporte a portrait de `specs/006-responsividade-mobile` | PASS |
| IV. Simplicidade deliberada no MVP | Reaproveita o padrão já existente (`Math.random()` para escolha de alvo) em vez de introduzir um gerador de números pseudoaleatórios ou biblioteca nova; expande uma constante existente em vez de criar um sistema novo | PASS |
| V. Responsividade do clique é não-negociável | Seleção de ponto é aritmética simples sobre arrays de tamanho fixo (≤4 regiões, 3 pontos cada) — nenhuma mudança em hit-testing (`CollisionSystem`) ou no cálculo de posição por frame (`positionAt`) | PASS |
| VI. Assets versionados e organizados desde o início | Nenhum asset novo | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

**Re-check pós-Phase 1**: `research.md`/`data-model.md`/`contracts/spawn-point-selection.md` confirmam
que nenhum campo novo é adicionado a `Match`/`Roach`/`MatchSnapshot`, que `entities/` permanece
intocado, e que a única estrutura de dados nova (`SPAWN_POINTS_BY_REGION`) é uma constante estática em
`config/gameConfig.ts` — todas as avaliações da tabela acima continuam válidas sem alteração.

## Project Structure

### Documentation (this feature)

```text
specs/010-variacao-pontos-spawn/
├── plan.md                              # This file (/speckit-plan command output)
├── research.md                          # Phase 0 output (/speckit-plan command)
├── data-model.md                        # Phase 1 output (/speckit-plan command)
├── quickstart.md                        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── spawn-point-selection.md         # Phase 1 output (/speckit-plan command)
└── tasks.md                             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── src/
│   ├── config/
│   │   └── gameConfig.ts         # SPAWN_POINTS/nearestSpawnPoint → SPAWN_POINTS_BY_REGION/
│   │                              # nearestSpawnRegion/pickSpawnPoint (funções puras, sem estado)
│   ├── entities/                 # inalterado — Roach.spawnPoint continua sendo apenas um Point
│   │   └── Roach.ts
│   └── systems/
│       └── MatchStateManager.ts  # tick() passa a chamar nearestSpawnRegion + pickSpawnPoint;
│                                  # + campo privado lastSpawnPointByTarget (Map<string, Point>),
│                                  # limpo em start()/restart()
└── tests/unit/
    ├── gameConfig.spawnRegions.test.ts          # NOVO — cobre nearestSpawnRegion/spawnPointCandidates/pickSpawnPoint
    ├── matchStateManager.spawnVariety.test.ts   # NOVO — cobre variedade de ponto (US1, FR-004) e
    │                                             #   não-repetição do ponto anterior (US3, FR-005)
    └── matchStateManager.spawnCoherence.test.ts # NOVO — cobre a coerência região/alvo em tick() (US2, FR-003)
```

**Structure Decision**: nenhuma pasta nova é criada. A mudança fica inteiramente dentro de
`config/gameConfig.ts` (dados + funções puras de seleção, mesmo lugar de `SPAWN_POINTS`/
`nearestSpawnPoint` hoje) e `systems/MatchStateManager.ts` (o único ponto de chamada existente). Não
há necessidade de uma nova Scene, novo sistema ou nova pasta — a feature é uma extensão de uma
constante/função já existente, consistente com o Princípio IV (simplicidade deliberada).
`entities/`/`scenes/` permanecem intocados.

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
