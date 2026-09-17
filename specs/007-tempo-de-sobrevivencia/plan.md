# Implementation Plan: Cronômetro de Tempo de Sobrevivência

**Branch**: `007-tempo-de-sobrevivencia` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-tempo-de-sobrevivencia/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Exibir um cronômetro de tempo decorrido na tela de jogo, que inicia em zero junto com a partida,
avança continuamente enquanto `Match.status === 'playing'`, congela no instante exato da derrota
(todas as comidas roubadas) e reinicia a zero em qualquer novo `start()`/`restart()`. Abordagem
técnica: dois novos campos mutáveis em `Match` (`startedAt`, `endedAt`), no mesmo padrão já usado
para `score`/`comboStreak` (specs/004); duas funções puras novas em `entities/Match.ts`
(`elapsedMs`, `formatElapsedTime`); `MatchSnapshot` passa a expor `startedAt`/`endedAt` brutos (sem
pré-calcular o tempo decorrido), e `GameScene`/`GameOverScene` chamam `elapsedMs(snapshot, now)`
diretamente a cada leitura — mesmo padrão já usado por `positionAt(roach, now, target)` para
interpolar posição de barata, em vez de embutir um valor que muda a cada frame dentro do snapshot.
`GameScene` atualiza o texto do cronômetro em `update()`, mas só chama `setText` quando o segundo
inteiro exibido muda (throttle de redraw, não de cálculo), reaproveitando a mesma disciplina de
performance já documentada no HUD existente. `GameOverScene` lê o valor já congelado
(`endedAt` definido) uma única vez em `create()`, sem assinar nenhum evento novo.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Phaser 4.2.1 (render/scene graph) — nenhuma dependência nova

**Storage**: N/A — o cronômetro vive apenas em memória, por partida corrente (`Match`); sem
persistência entre partidas nesta feature (spec.md, Assumptions — "high score local" é item de
backlog separado, fora de escopo)

**Testing**: `bun test` para as novas funções puras de domínio (`elapsedMs`, `formatElapsedTime`) e
para a orquestração em `MatchStateManager` (`startedAt` fixado em `start()`/`restart()`, `endedAt`
fixado exatamente no `tick()` que causa a derrota); validação visual manual via `bun run dev` para
a exibição no HUD e na tela de fim de jogo (sem suíte de testes de renderização Phaser no projeto,
mesmo padrão de specs 002/003/004)

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalterada (Princípio V). O
cálculo de `elapsedMs` é uma subtração O(1) por frame (mesmo custo de `positionAt` já chamado por
barata ativa); a atualização visual do texto (`setText`) é throttled para disparar no máximo uma
vez por segundo (quando o segundo inteiro exibido muda), não a cada um dos ~60 frames/s

**Constraints**: o cálculo do tempo decorrido DEVE viver na camada de domínio, sem import de
`phaser` (FR-002/FR-003/FR-004, Princípio I); `createMatch()` continua chamável sem argumentos
(`now: number = Date.now()`, mesmo padrão de `MatchStateManager.start()`) para não quebrar os
testes/call sites existentes que já chamam `createMatch()`; sem persistência entre partidas
(Princípio VII)

**Scale/Scope**: 2 campos novos em `Match`/`MatchSnapshot` (`startedAt`, `endedAt`) + 2 funções
puras novas; duração de partida sem limite superior fixo (Edge Case da spec — "dezenas de
minutos" — formato `MM:SS` sem rollover de horas, por simplicidade deliberada)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | `elapsedMs` e `formatElapsedTime` são funções puras em `entities/Match.ts`, sem import de `phaser`, testáveis via `bun test` isoladamente; `GameScene`/`GameOverScene` só chamam essas funções com dados já lidos do snapshot, nunca reimplementam o cálculo | PASS |
| II. Cliente como única camada, tratado como não confiável | `startedAt`/`endedAt` são campos do `Match`, geridos exclusivamente pelo `MatchStateManager` (mesmo padrão de `status`/`score`); nenhuma scene escreve esses campos diretamente | PASS |
| III. Web-first, mobile depois | Nenhum novo handler de input é criado; a feature não introduz nem altera nenhum evento de ponteiro | PASS |
| IV. Simplicidade deliberada no MVP | Sem pontuação adicional, sem dificuldade progressiva, sem persistência de recorde (FR-009 da spec, explicitamente fora de escopo); formato de exibição fixo (`MM:SS`, sem configuração, sem rollover de horas) | PASS |
| V. Responsividade do clique é não-negociável | Nenhuma lógica de colisão/hit-testing é tocada; o custo por frame do cronômetro é uma subtração e uma comparação de inteiro, e o redraw de texto é throttled a 1x/s | PASS |
| VI. Assets versionados e organizados desde o início | Nenhum novo asset binário — cronômetro é texto (`Phaser.GameObjects.Text`), reaproveitando o padrão já usado pelo HUD (specs/002/004) | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova; usa apenas Phaser/TypeScript/Bun/Vite já fixados | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

## Project Structure

### Documentation (this feature)

```text
specs/007-tempo-de-sobrevivencia/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── domain-api-timer.md # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── src/
│   ├── entities/
│   │   └── Match.ts              # + campos startedAt/endedAt; + elapsedMs(), formatElapsedTime()
│   ├── systems/
│   │   └── MatchStateManager.ts  # start()/restart() fixam startedAt; tick() fixa endedAt na derrota; MatchSnapshot += startedAt/endedAt
│   └── scenes/
│       ├── GameScene.ts          # + Text do cronômetro (topo-esquerda, espelhando vida/score no topo-direita), atualizado em update() com throttle de 1x/s
│       └── GameOverScene.ts      # + exibição do tempo de sobrevivência final, lido do snapshot já congelado
├── tests/
│   └── unit/
│       ├── match.timer.test.ts          # novo — cobre elapsedMs() (partida em andamento vs. congelada) e formatElapsedTime() (limiares de minuto/segundo)
│       ├── matchStateManager.timer.test.ts # novo — cobre orquestração: startedAt em start()/restart(), endedAt fixado exatamente no tick() da derrota, reset em restart()
│       ├── match.hud.test.ts            # existente — helper `matchWithRemaining` precisa incluir os novos campos obrigatórios do `Match` (startedAt: 0, endedAt: null)
│       └── match.score.test.ts          # existente — nenhuma mudança necessária (createMatch() continua chamável sem argumentos)
```

**Structure Decision**: nenhuma pasta nova é criada. A feature estende exatamente os mesmos três
arquivos de domínio/orquestração/renderização já tocados pelas features de HUD e pontuação
(specs/002, specs/004): `Match.ts` (estado + funções puras), `MatchStateManager.ts`
(orquestração/exposição via snapshot) e `GameScene.ts`, acrescentando `GameOverScene.ts` para o
tempo final — mesmo padrão já usado pela pontuação final (specs/004). Não há justificativa para um
arquivo `entities/Timer.ts` ou um sistema de cronômetro separado — o volume de lógica (duas
subtrações, uma formatação de string) é pequeno o bastante para caber nas convenções já
estabelecidas (Princípio IV).

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
