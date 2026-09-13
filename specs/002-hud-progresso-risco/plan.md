# Implementation Plan: HUD de Progresso/Risco

**Branch**: `002-hud-progresso-risco` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-hud-progresso-risco/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Adicionar um indicador de HUD, visível apenas durante `GameScene`, que combina uma contagem
numérica de comidas restantes com uma barra/cor de risco em três níveis (seguro / risco elevado /
crítico), derivados do estado já exposto pelo `MatchStateManager`. Abordagem técnica: os cálculos
de contagem e nível de risco são funções puras adicionadas à camada de domínio (`entities/Match.ts`)
e expostas via `MatchSnapshot`; `GameScene` apenas lê esses campos já calculados e desenha/atualiza
texto e uma barra com `Phaser.GameObjects.Text`/`Graphics`, sem introduzir novos assets nem nova
lógica de jogo dentro da scene (Princípios I e II).

Nota de rastreabilidade (`/speckit-analyze`, achado C3): por serem elementos visuais adjacentes na
mesma scene, a implementação da barra de risco (User Story 2) reaproveita o objeto de texto do HUD
criado pela User Story 1 no mesmo arquivo `GameScene.ts` — as duas stories são independentemente
**testáveis** (dá para validar a US1 sozinha antes da barra existir), mas não estritamente
independentes no código-fonte. Ver `tasks.md` § User Story Dependencies.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Phaser 4.2.1 (render/scene graph) — nenhuma dependência nova

**Storage**: N/A — o HUD reflete apenas o estado da `Match` corrente, em memória (spec.md, Assumptions)

**Testing**: `bun test` (test runner nativo do Bun) para as novas funções puras de domínio
(`foodRemainingCount`, `foodTotalCount`, `riskLevel`); validação visual manual via `bun run dev`
para o desenho do HUD (não há suíte de testes de renderização Phaser no projeto)

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalterada (Princípio V; SC-002,
SC-003 da spec) — o HUD só deve redesenhar texto/barra quando o valor mudar, nunca recalcular ou
redesenhar incondicionalmente a cada frame

**Constraints**: HUD não pode sobrepor prateleiras, comidas ou a área de hit-test das baratas
(FR-007); nenhum novo asset binário é necessário (texto/gráficos primitivos do Phaser cobrem o
requisito, evitando overhead de asset pipeline — Princípio VI só se aplica quando há arquivo de
asset real); sem persistência entre partidas (Princípio VII)

**Scale/Scope**: 1 elemento de HUD por partida, reagindo a no máximo 9 transições de "comida
roubada" por partida (`TOTAL_FOOD_ITEMS`, `gameConfig.ts`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | `foodRemainingCount`/`foodTotalCount`/`riskLevel` são funções puras em `entities/Match.ts`, sem import de `phaser`, testáveis via `bun test` isoladamente; `GameScene` só lê os valores já calculados em `MatchSnapshot` | PASS |
| II. Cliente como única camada, tratado como não confiável | O HUD não introduz estado próprio na scene — lê exclusivamente `MatchSnapshot` via `MatchStateManager`, igual aos sprites de comida/barata já existentes | PASS |
| III. Web-first, mobile depois | O HUD é somente leitura (não recebe input); não introduz nenhum novo handler de mouse/teclado, preservando o modelo de Pointer Events já usado para o clique nas baratas | PASS |
| IV. Simplicidade deliberada no MVP | Três níveis fixos de risco (thresholds fixos definidos na spec), sem configuração, sem pontuação, sem persistência — nada além do que a spec exige | PASS |
| V. Responsividade do clique é não-negociável | O HUD é atualizado por evento (`food:stolen`/`match:started`), não por recomputo pesado a cada frame; posicionado fora da área de prateleiras/comidas/baratas (FR-007), sem afetar hit-testing | PASS |
| VI. Assets versionados e organizados desde o início | Nenhum novo asset binário é adicionado nesta feature (texto/formas via Phaser); caso uma iteração futura precise de ícones, entram em `client/public/assets/sprites/` seguindo a convenção existente | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova; usa apenas Phaser/TypeScript/Bun/Vite já fixados | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

## Project Structure

### Documentation (this feature)

```text
specs/002-hud-progresso-risco/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── domain-api-hud.md # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── src/
│   ├── config/
│   │   └── gameConfig.ts        # já expõe TOTAL_FOOD_ITEMS; nenhuma nova constante obrigatória
│   ├── entities/
│   │   └── Match.ts              # + foodRemainingCount(), foodTotalCount(), riskLevel(), RiskLevel
│   ├── systems/
│   │   └── MatchStateManager.ts  # MatchSnapshot passa a incluir foodRemainingCount/foodTotalCount/riskLevel
│   └── scenes/
│       └── GameScene.ts          # + criação/atualização do HUD (Text + Graphics), sem novo arquivo de scene
├── tests/
│   └── unit/
│       └── match.hud.test.ts     # novo — cobre foodRemainingCount/foodTotalCount/riskLevel
```

**Structure Decision**: nenhuma pasta nova é criada. A feature estende arquivos já existentes nas
camadas `entities/` (cálculo puro), `systems/` (exposição via snapshot) e `scenes/` (desenho),
seguindo exatamente a separação já estabelecida pelo MVP (`001-roach-fridge-clicker`) — não há
justificativa para uma nova pasta `ui/` ou uma nova `Scene` dedicada, dado o escopo pequeno e único
elemento visual (Princípio IV).

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
