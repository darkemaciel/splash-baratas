# Implementation Plan: Loop Principal — Baratas na Geladeira

**Branch**: `001-roach-fridge-clicker` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-roach-fridge-clicker/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Jogo de navegador estilo "point and click": baratas surgem em pontos fixos nas bordas da cena,
miram uma comida específica de uma prateleira e se movem até ela por um tempo fixo de reação; o
jogador clica para eliminá-las antes que roubem a comida. A partida termina em derrota quando
todas as comidas forem roubadas, com opção de reiniciar sem recarregar a página. Abordagem
técnica: lógica de jogo (spawn, movimento, roubo, derrota) implementada como classes de domínio
puras em TypeScript, sem nenhum import de `phaser`, expostas às `scenes/` do Phaser através de um
único serviço (`MatchStateManager`) com hit-testing direto (geometria simples) para detecção de
clique — sem física pesada — garantindo a responsividade de clique exigida pela constitution.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Phaser 4.2.1 (render/scene graph), Vite 8.3.0 (bundler/dev server), Bun (runtime/gerenciador de pacotes)

**Storage**: N/A — sem backend no MVP; todo o estado da `Match` vive em memória no cliente

**Testing**: `bun test` (test runner nativo do Bun) para a camada de domínio (`entities/`, `systems/`) — ver research.md §1

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável durante toda a partida; detecção de clique e remoção visual da barata sem atraso perceptível (Princípio V da constitution; SC-002, SC-006 da spec)

**Constraints**: Hit-testing direto por geometria (círculo), sem física pesada do Phaser, para detecção de clique (Princípio V); input via Pointer Events, não Mouse/Keyboard Events (Princípio III); sem backend/persistência (Princípio VII)

**Scale/Scope**: 1 partida ativa por vez, 3 prateleiras × 3 comidas = 9 comidas por partida (research.md §2); no máximo 9 baratas ativas simultaneamente (uma por comida restante, FR-021)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | `entities/` e `systems/` são TypeScript puro, sem import de `phaser`; `MatchStateManager` (contracts/domain-api.md) é a única fronteira com as `scenes/`, testável via `bun test` sem o Phaser renderizar nada | PASS |
| II. Cliente como única camada, tratado como não confiável | Todo estado de `Match` vive em `MatchStateManager`/entidades de domínio, nunca em callbacks de `scenes/` ou handlers de evento do Phaser | PASS |
| III. Web-first, mobile depois | `CollisionSystem.hitTestRoach` é acionado a partir de eventos de ponteiro (`pointerdown` do Phaser, que já abstrai mouse/touch), nunca Mouse/Keyboard Events diretamente | PASS |
| IV. Simplicidade deliberada no MVP | Nenhuma estrutura para dificuldade progressiva ou pontuação é introduzida; `Match.status` tem apenas os estados necessários ao MVP (`notStarted/playing/lost`) | PASS |
| V. Responsividade do clique é não-negociável | `hitTestRoach` usa apenas geometria (círculo + padding fixo), sem Arcade/Matter Physics; posição da barata é recalculada por interpolação a cada tick, sincronizada com o render | PASS |
| VI. Assets versionados e organizados desde o início | Estrutura de projeto usa `client/public/assets/{sprites,audio,fonts}` desde a primeira task de assets, mesmo com arte placeholder | PASS |
| VII. Stack fixada para o MVP | TypeScript + Phaser + Bun + Vite + Vercel, sem backend — nenhuma dependência nova fora de `bun test` (já incluso no Bun) | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

## Project Structure

### Documentation (this feature)

```text
specs/001-roach-fridge-clicker/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── domain-api.md    # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório
├── src/
│   ├── config/                  # constantes: spawn interval, travel duration, hitbox padding,
│   │                             # contagem de prateleiras/comidas (research.md)
│   ├── entities/                 # FoodItem, Shelf, Roach, Match — TypeScript puro, zero import
│   │                             # de `phaser` (Princípio I)
│   ├── systems/                  # MatchStateManager, CollisionSystem — API de domínio
│   │                             # (contracts/domain-api.md)
│   ├── scenes/                   # BootScene, StartScene, GameScene, GameOverScene (Phaser),
│   │                             # únicas consumidoras de systems/
│   └── ui/                       # botões/elementos de UI do Phaser (ex: botão reiniciar)
├── public/
│   └── assets/
│       ├── sprites/               # arte placeholder de baratas/comidas/geladeira
│       ├── audio/                 # vazio nesta versão (sem feedback sonoro, FR-020)
│       └── fonts/
├── tests/
│   └── unit/                     # bun test — exercita entities/ e systems/ isoladamente
├── index.ts                       # bootstrap do Phaser.Game (a ser expandido pela implementação)
├── vite.config.ts                 # a ser criado pela implementação (ainda não existe)
├── package.json
└── tsconfig.json
```

**Structure Decision**: projeto único (Option 1), sem separação frontend/backend — o "backend" é
N/A por decisão de constitution (Princípio VII). Toda a estrutura vive dentro do workspace
existente `client/`, reaproveitando o scaffold já criado (`src/{config,entities,scenes,systems,ui}`)
e adicionando apenas `tests/unit/` e, futuramente, `vite.config.ts` (tarefa de implementação, fora
do escopo deste plano).

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
