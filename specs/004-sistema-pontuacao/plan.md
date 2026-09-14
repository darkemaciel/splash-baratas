# Implementation Plan: Sistema de Pontuação

**Branch**: `004-sistema-pontuacao` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-sistema-pontuacao/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Adicionar uma pontuação numérica por partida que soma um valor base a cada barata eliminada, mais
um bônus de velocidade de reação (por faixas de tempo desde o spawn até o clique) e um bônus de
combo crescente por eliminações consecutivas sem falha, dentro de uma janela de tempo entre
eliminações. Abordagem técnica: `score`, `comboStreak` e `lastEliminationAt` passam a ser campos
mutáveis do `Match` (mesmo padrão de `status`); o cálculo de pontos (base + bônus de reação em
faixas + bônus de combo linear) vive em funções puras novas em `entities/Match.ts`, testáveis
isoladamente via `bun test`; `MatchStateManager.tryEliminateRoach` aplica a pontuação antes de
remover a barata, `tick()` reseta o combo ao roubo de comida, e um novo método público
`registerMissedClick()` reseta o combo quando `GameScene` detecta um clique sem acerto — reaproveitando
o hit-test do `CollisionSystem` já existente, sem nova lógica de colisão. `MatchSnapshot` passa a
expor `score`; `GameScene` reutiliza o padrão de atualização por evento já estabelecido pelo HUD de
progresso/risco (specs/002) para exibir a pontuação, e `GameOverScene` exibe a pontuação final.

Nota de rastreabilidade (`/speckit-analyze`, achado I2): assim como em `002-hud-progresso-risco`,
as User Stories 2 e 3 não são estritamente independentes no código — ambas estendem a mesma função
`applyEliminationScore()` criada pela User Story 1, em vez de introduzir uma função própria. As três
user stories continuam independentemente **testáveis** (dá para validar US1 sozinha, depois
US1+US2, antes de o bônus de combo existir), mas não são independentes na implementação. Ver
`tasks.md` § User Story Dependencies.

## Technical Context

**Language/Version**: TypeScript (via `tsconfig.json` do workspace `client/`), executado com Bun

**Primary Dependencies**: Phaser 4.2.1 (render/scene graph) — nenhuma dependência nova

**Storage**: N/A — pontuação vive apenas em memória, por partida (`Match`); sem persistência entre
partidas nesta feature (spec.md, Assumptions — high score/`localStorage` é item de backlog
separado)

**Testing**: `bun test` para as novas funções puras de domínio (`reactionBonusPoints`,
`comboBonusPoints`, `applyEliminationScore`, `resetComboStreak`) e para a orquestração em
`MatchStateManager` (pontuação em `tryEliminateRoach`, reset de combo em `tick()`/`registerMissedClick()`);
validação visual manual via `bun run dev` para a exibição no HUD e na tela de fim de jogo (sem
suíte de testes de renderização Phaser no projeto, mesmo padrão de specs 002/003)

**Target Platform**: Navegador (Chrome, Firefox, Edge atuais), resoluções desktop; build estático
servido via Vercel

**Project Type**: Web — cliente único (jogo client-side), sem projeto de backend separado

**Performance Goals**: 60 FPS estável e responsividade de clique inalterada (Princípio V; SC-005 da
spec) — o cálculo de pontuação é O(1) por eliminação (sem alocação/iteração pesada), e a
atualização visual do HUD é disparada por evento (`roach:eliminated`), nunca recalculada
incondicionalmente a cada frame

**Constraints**: o cálculo de pontuação DEVE viver na camada de domínio, sem import de `phaser`
(FR-012, Princípio I); nenhuma regra nova de hit-testing é introduzida — "clique sem acertar
nenhuma barata" reaproveita exatamente a mesma saída de `pickTopmostHit` já usada para o som de
erro (`sfx-miss`); sem persistência entre partidas (Princípio VII)

**Scale/Scope**: 1 contador de pontuação + 1 contador de combo por partida; nº de eventos de
pontuação por partida não é fixo em 9 (`TOTAL_FOOD_ITEMS`) — uma comida pode gerar múltiplas
baratas/eliminações ao longo do tempo até a partida terminar, então o contador cresce
indefinidamente enquanto a partida estiver em andamento

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Avaliação | Status |
|---|---|---|
| I. Separação entre lógica de jogo e renderização | `reactionBonusPoints`, `comboBonusPoints`, `applyEliminationScore` e `resetComboStreak` são funções puras em `entities/Match.ts`, sem import de `phaser`, testáveis via `bun test` isoladamente; `GameScene`/`GameOverScene` só leem `score` já calculado em `MatchSnapshot` | PASS |
| II. Cliente como única camada, tratado como não confiável | Pontuação e combo são campos do `Match`, geridos exclusivamente pelo `MatchStateManager` (mesmo padrão de `status`/`activeRoaches`); nenhuma scene lê ou escreve esse estado diretamente | PASS |
| III. Web-first, mobile depois | Nenhum novo handler de input é criado — `registerMissedClick()` é chamado a partir do mesmo `pointerdown` já tratado via Pointer Events em `GameScene.handlePointerDown` | PASS |
| IV. Simplicidade deliberada no MVP | Esta feature só existe porque "Sistema de pontuação" foi formalmente priorizado no backlog (P1) e ganhou spec própria — exatamente o caminho que o Princípio IV exige ("quando essas features forem priorizadas, entram como spec nova"), não uma antecipação especulativa. Fórmulas usam faixas fixas simples (tiers), não curvas configuráveis ou sistemas de balanceamento genéricos | PASS |
| V. Responsividade do clique é não-negociável | O cálculo de pontuação roda uma vez por eliminação (evento discreto), não por frame; não altera o hit-testing geométrico existente (`CollisionSystem`) nem adiciona lógica de física | PASS |
| VI. Assets versionados e organizados desde o início | Nenhum novo asset binário — pontuação é texto (`Phaser.GameObjects.Text`), reaproveitando o padrão já usado pelo HUD (specs/002) | PASS |
| VII. Stack fixada para o MVP | Nenhuma dependência nova; usa apenas Phaser/TypeScript/Bun/Vite já fixados | PASS |

Nenhuma violação identificada. Tabela de Complexity Tracking abaixo permanece vazia.

## Project Structure

### Documentation (this feature)

```text
specs/004-sistema-pontuacao/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── domain-api-score.md # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
client/                          # único workspace do repositório (reaproveitado, não recriado)
├── src/
│   ├── config/
│   │   └── gameConfig.ts        # + SCORE_BASE_POINTS, REACTION_BONUS_TIERS, COMBO_BONUS_STEP_POINTS, COMBO_WINDOW_MS
│   ├── entities/
│   │   └── Match.ts              # + campos score/comboStreak/lastEliminationAt; + reactionBonusPoints(), comboBonusPoints(), applyEliminationScore(), resetComboStreak()
│   ├── systems/
│   │   └── MatchStateManager.ts  # MatchSnapshot += score; tryEliminateRoach() aplica pontuação; tick() reseta combo ao roubo; + registerMissedClick()
│   └── scenes/
│       ├── GameScene.ts          # + Text de pontuação (junto ao HUD existente), atualizado em "roach:eliminated"; handlePointerDown chama registerMissedClick() no branch de erro
│       └── GameOverScene.ts      # + exibição da pontuação final lida do snapshot
├── tests/
│   └── unit/
│       ├── match.score.test.ts          # novo — cobre reactionBonusPoints/comboBonusPoints/applyEliminationScore/resetComboStreak
│       ├── matchStateManager.score.test.ts # novo — cobre orquestração: pontuação em eliminação, reset de combo (roubo/erro/timeout), persistência até o fim de jogo, reset no restart
│       └── match.hud.test.ts            # existente — helper `matchWithRemaining` precisa incluir os novos campos obrigatórios do `Match` (score/comboStreak/lastEliminationAt)
```

**Structure Decision**: nenhuma pasta nova é criada. A feature estende exatamente os mesmos quatro
arquivos já tocados pela feature de HUD (specs/002): `gameConfig.ts` (constantes), `Match.ts`
(estado + funções puras), `MatchStateManager.ts` (orquestração/exposição via snapshot) e
`GameScene.ts` (renderização), acrescentando `GameOverScene.ts` para a pontuação final. Não há
justificativa para um novo arquivo `entities/Score.ts` ou uma camada de "sistema de pontuação"
separada — o volume de lógica é pequeno o bastante para caber nas convenções já estabelecidas
(Princípio IV).

## Complexity Tracking

*Nenhuma violação de constitution identificada — tabela intencionalmente vazia.*
