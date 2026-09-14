---

description: "Task list template for feature implementation"
---

# Tasks: Sistema de Pontuação

**Input**: Design documents from `/specs/004-sistema-pontuacao/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/domain-api-score.md,
quickstart.md

**Tests**: incluídas — `research.md` §8 e o campo `Testing` de `plan.md` já decidem por `bun test`
cobrindo as novas funções puras de domínio (`reactionBonusPoints`, `comboBonusPoints`,
`applyEliminationScore`, `resetComboStreak`) e a orquestração em `MatchStateManager`, seguindo o
padrão já estabelecido pelo MVP e por `002-hud-progresso-risco`.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/`, `client/tests/unit/` (ver `plan.md` → Project Structure). Nenhuma
pasta nova é criada; todos os arquivos abaixo já existem (MVP + specs 002/003), exceto
`client/tests/unit/match.score.test.ts` e `client/tests/unit/matchStateManager.score.test.ts`, que
são novos.

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em arquivos compartilhados
(`entities/Match.ts`, `systems/MatchStateManager.ts`, `scenes/GameScene.ts`,
`scenes/GameOverScene.ts`).

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente (MVP +
  `002-hud-progresso-risco` + `003-feedback-sonoro-sfx`) passa antes de iniciar qualquer alteração
  (baseline; nenhuma dependência nova é necessária — `plan.md` § Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Campos de estado (`score`, `comboStreak`, `lastEliminationAt`), constantes de
balanceamento e a extensão de `MatchSnapshot` que **todas** as user stories desta feature precisam,
sem ainda nenhum comportamento de pontuação visível.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T002 [P] Adicionar a `client/src/config/gameConfig.ts` as constantes
  `SCORE_BASE_POINTS = 100`, `REACTION_BONUS_TIERS = [{ maxMs: 500, bonus: 50 }, { maxMs: 1000, bonus: 25 }, { maxMs: 1500, bonus: 10 }]`,
  `COMBO_BONUS_STEP_POINTS = 25` e `COMBO_WINDOW_MS = 3000` (data-model.md § "Constantes de
  balanceamento") *(nota: `COMBO_WINDOW_MS` foi ajustado de 2000 para 3000 durante a
  implementação da US3 — ver research.md §4)*
- [X] T003 Adicionar os campos `score: number`, `comboStreak: number` e
  `lastEliminationAt: number | null` à interface `Match` em `client/src/entities/Match.ts`,
  inicializados como `0`, `0` e `null` tanto em `createMatch()` quanto em `createEmptyMatch()`
  (data-model.md § "Campos adicionados a Match")
- [X] T004 Atualizar o helper `matchWithRemaining` em `client/tests/unit/match.hud.test.ts` para
  incluir `score: 0, comboStreak: 0, lastEliminationAt: null` no objeto `Match` literal que ele
  constrói, já que esses campos passam a ser obrigatórios na interface (data-model.md § "Impacto em
  testes existentes") (depende de T003)
- [X] T005 Estender a interface `MatchSnapshot` em `client/src/systems/MatchStateManager.ts` com
  `readonly score: number`, calculado em `getSnapshot()` como cópia direta de `match.score`
  (contracts/domain-api-score.md) (depende de T003)
- [X] T006 Rodar `bun test` em `client/` e confirmar zero regressões após T002–T005 (a suíte
  existente deve compilar e passar com os novos campos do `Match`) (depende de T004, T005)

**Checkpoint**: `Match`/`MatchSnapshot` já carregam `score` (sempre `0` neste ponto); nenhuma
lógica de pontuação existe ainda — User Story 1 pode começar.

---

## Phase 3: User Story 1 - Ganhar pontos ao eliminar baratas (Priority: P1) 🎯 MVP

**Goal**: Toda eliminação válida de barata soma um valor de pontuação base fixo à pontuação da
partida, exibida em tempo real no HUD e preservada até a tela de fim de jogo (FR-001, FR-002,
FR-003, FR-009, FR-010, FR-012).

**Independent Test**: iniciar uma partida (pontuação em 0), eliminar uma barata e confirmar que a
pontuação sobe imediatamente pelo valor base; deixar uma barata roubar uma comida e confirmar que
a pontuação não muda; jogar até a derrota e confirmar que a pontuação final exibida é coerente.

### Tests for User Story 1

> **NOTE: escrever estes testes primeiro e confirmar que falham antes de implementar**

- [X] T007 [P] [US1] Escrever teste que falha para `applyEliminationScore(match, now, spawnedAt)`
  em `client/tests/unit/match.score.test.ts` (novo arquivo): uma eliminação isolada soma
  exatamente `SCORE_BASE_POINTS` a `match.score` e a função retorna esse mesmo valor
  (data-model.md § "applyEliminationScore")
- [X] T008 [P] [US1] Escrever teste que falha para a orquestração em
  `client/tests/unit/matchStateManager.score.test.ts` (novo arquivo), cobrindo via
  `tryEliminateRoach()`/`tick()`/`restart()`: (a) `tryEliminateRoach()` soma
  `SCORE_BASE_POINTS` a `getSnapshot().score`; (b) três eliminações seguidas (espaçadas o
  suficiente para nunca cair em bônus de reação/combo futuros) somam exatamente
  `3 * SCORE_BASE_POINTS`, sem perda nem duplicação de pontos (FR-001, SC-004 — cobertura parcial
  só com pontuação base; a cobertura completa com bônus fica em T027); (c) uma comida roubada via
  `tick()` não altera `score` (FR-003); (d) `restart()` volta `score` para `0` (FR-011).
  *(Notas de implementação: "clique sem acertar não altera `score`" foi movida para T027 —
  `registerMissedClick()` só existe a partir de T025, US3. O reset de `comboStreak` no restart não
  é observável em `MatchSnapshot` por design (contracts/domain-api-score.md — é detalhe interno),
  então é verificado a nível de entidade em T007's arquivo: ver a asserção de
  `createMatch()`/`createEmptyMatch()` adicionada em `match.score.test.ts`.)*

### Implementation for User Story 1

- [X] T009 [US1] Implementar `applyEliminationScore(match, now, spawnedAt): number` em
  `client/src/entities/Match.ts`, somando por enquanto apenas `SCORE_BASE_POINTS` a `match.score`
  (o bônus de reação entra na User Story 2, o de combo na User Story 3) — faz T007 passar (depende
  de T007, T002, T003)
- [X] T010 [US1] Em `tryEliminateRoach()` de `client/src/systems/MatchStateManager.ts`, chamar
  `applyEliminationScore(this.match, clientTimestamp, roach.spawnedAt)` antes de `removeRoach()` e
  `this.emit("roach:eliminated", ...)` — faz T008 passar (depende de T008, T009, T005)
- [X] T011 [US1] Em `create()` de `client/src/scenes/GameScene.ts`, criar um
  `Phaser.GameObjects.Text` (`scoreText`) posicionado logo abaixo da barra de risco existente
  (`HUD_BAR_Y + HUD_BAR_HEIGHT` + margem, research.md §7), inicializado a partir de
  `matchStateManager.getSnapshot().score` (depende de T005)
- [X] T012 [US1] Em `client/src/scenes/GameScene.ts`, assinar o evento já existente
  `roach:eliminated` (junto à lista `this.unsubscribers`) para atualizar `scoreText` relendo
  `matchStateManager.getSnapshot().score` (FR-009) (depende de T010, T011)
- [X] T013 [US1] Em `create()` de `client/src/scenes/GameOverScene.ts`, ler
  `matchStateManager.getSnapshot().score` e exibir como um `Phaser.GameObjects.Text` estático
  centralizado em `(GAME_WIDTH / 2, GAME_HEIGHT / 2)` — entre a mensagem de derrota existente
  (`GAME_HEIGHT / 2 - 60`) e o botão "Reiniciar" (`GAME_HEIGHT / 2 + 60`) — com o texto no formato
  `"Pontuação final: {score}"` (FR-010) (depende de T010)
- [ ] T014 [US1] Validar manualmente o cenário 1 do
  `specs/004-sistema-pontuacao/quickstart.md` (pontuação básica por eliminação) rodando
  `bun run dev` em `client/`

**Checkpoint**: User Story 1 completa e testável de forma independente — pontuação base funcional,
visível no HUD e preservada até o fim de jogo, sem nenhum bônus ainda.

---

## Phase 4: User Story 2 - Bônus por velocidade de reação (Priority: P2)

**Goal**: Eliminações rápidas após o spawn da barata rendem pontos extras, em faixas fixas, além do
valor base (FR-004, FR-005).

**Independent Test**: eliminar uma barata poucos instantes após seu spawn e comparar a pontuação
ganha com uma eliminação tardia da mesma barata — a primeira deve render mais pontos que o valor
base isolado; a segunda deve render exatamente o valor base.

### Tests for User Story 2

- [X] T015 [P] [US2] Escrever testes que falham para `reactionBonusPoints(reactionMs)` em
  `client/tests/unit/match.score.test.ts`, cobrindo os limites exatos de
  `REACTION_BONUS_TIERS` (500ms → `+50`, 1000ms → `+25`, 1500ms → `+10`) e um valor acima de
  1500ms → `+0` (data-model.md, Edge Case "limite exato" da spec)

### Implementation for User Story 2

- [X] T016 [US2] Implementar `reactionBonusPoints(reactionMs: number): number` em
  `client/src/entities/Match.ts`, usando `REACTION_BONUS_TIERS` (T002), avaliando as faixas em
  ordem crescente com limite inclusivo (`<=`) — faz T015 passar (depende de T015, T002)
- [X] T017 [US2] Em `applyEliminationScore()` (T009) de `client/src/entities/Match.ts`, somar
  `reactionBonusPoints(now - spawnedAt)` ao total de pontos da eliminação (depende de T016, T009)
- [X] T018 [US2] Estender `client/tests/unit/matchStateManager.score.test.ts` com um teste
  cobrindo, via `tryEliminateRoach()`: uma eliminação rápida (`reactionMs <= 500`) rende mais
  pontos que uma eliminação tardia (`reactionMs > 1500`) da mesma barata (depende de T017)
- [ ] T019 [US2] Validar manualmente o cenário 2 do `specs/004-sistema-pontuacao/quickstart.md`
  (bônus de velocidade de reação) rodando `bun run dev`

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente — pontuação recompensa reação
rápida além do valor base.

---

## Phase 5: User Story 3 - Bônus de combo por eliminações consecutivas (Priority: P3)

**Goal**: Eliminações consecutivas bem-sucedidas, dentro de uma janela de tempo entre elas, rendem
um bônus de combo crescente; a sequência reseta ao roubo de comida, a um clique sem acerto, ou ao
estouro da janela de tempo (FR-006, FR-007, FR-008).

**Independent Test**: eliminar 3 baratas seguidas sem nenhum clique sem acertar nenhuma barata e
sem deixar nenhuma comida ser roubada, e confirmar pontuação extra crescente por eliminação; em
seguida, provocar cada um dos três gatilhos de reset (roubo, clique sem acertar nenhuma barata,
timeout) e confirmar que o combo reinicia em todos os casos.

### Tests for User Story 3

- [X] T020 [P] [US3] Escrever testes que falham para `comboBonusPoints(comboStreakAfterIncrement)`
  em `client/tests/unit/match.score.test.ts`, cobrindo `comboStreak` = 1 (→ `+0`), 2 (→ `+25`), 3
  (→ `+50`) e 5 (→ `+100`) (data-model.md § "comboBonusPoints")
- [X] T021 [P] [US3] Escrever testes que falham para `resetComboStreak(match)` (zera
  `comboStreak`, não afeta `score`/`lastEliminationAt`) e para o reset por timeout dentro de
  `applyEliminationScore` (uma eliminação após `> COMBO_WINDOW_MS` do `lastEliminationAt` anterior
  reinicia a sequência em vez de continuá-la) em `client/tests/unit/match.score.test.ts`
  (FR-008c)

### Implementation for User Story 3

- [X] T022 [US3] Implementar `comboBonusPoints(comboStreakAfterIncrement: number): number` e
  `resetComboStreak(match: Match): void` em `client/src/entities/Match.ts` (depende de T020, T021,
  T002)
- [X] T023 [US3] Em `applyEliminationScore()` de `client/src/entities/Match.ts`: antes de
  incrementar, resetar `match.comboStreak` para `0` se `match.lastEliminationAt !== null` e
  `now - match.lastEliminationAt > COMBO_WINDOW_MS`; incrementar `match.comboStreak` em `1`; somar
  `comboBonusPoints(match.comboStreak)` ao total de pontos da eliminação; por fim, atualizar
  `match.lastEliminationAt = now` — faz T020/T021 passarem (depende de T022, T017)
- [X] T024 [US3] No branch de `food:stolen` de `tick()` em
  `client/src/systems/MatchStateManager.ts`, chamar `resetComboStreak(this.match)`
  incondicionalmente antes de `this.emit("food:stolen", ...)` (FR-008a) (depende de T022)
- [X] T025 [US3] Adicionar o método público `registerMissedClick(): void` a
  `client/src/systems/MatchStateManager.ts`, chamando `resetComboStreak(this.match)`
  (contracts/domain-api-score.md) (depende de T022)
- [X] T026 [US3] Em `handlePointerDown()` de `client/src/scenes/GameScene.ts`, chamar
  `matchStateManager.registerMissedClick()` no branch onde `pickTopmostHit` retorna `undefined`
  (mesmo branch que hoje só toca `sfx-miss`) (FR-008b) (depende de T025)
- [X] T027 [US3] Estender `client/tests/unit/matchStateManager.score.test.ts` cobrindo, via
  `tryEliminateRoach()`/`tick()`/`registerMissedClick()`, sempre isolando o gatilho testado do
  reset por timeout (usando gaps < `COMBO_WINDOW_MS` para o que não deveria resetar, e > para o
  timeout em si): (a) pontuação de uma sequência de 3 eliminações consecutivas é maior que a soma
  das pontuações isoladas equivalentes (SC-003); (b) combo reseta após um `food:stolen`, mesmo bem
  dentro do que seria a janela de combo — e a pontuação final da partida bate exatamente com a
  soma das eliminações que de fato pontuaram (a barata que só rouba não contribui nada — FR-003,
  SC-004); (c) `registerMissedClick()` reseta o combo sem alterar `score` (FR-008b, FR-003 —
  movido de T008); (d) um intervalo maior que `COMBO_WINDOW_MS` entre duas eliminações reseta o
  combo (FR-008c). *(Nota de implementação: durante a escrita destes testes, descobriu-se que
  `COMBO_WINDOW_MS = 2000` tornava combos de 3+ inviáveis na prática — corrigido para `3000`, ver
  research.md §4. Os testes usam sempre o mesmo par-base de 2 baratas — spawn em 2500/5000,
  eliminadas em 5450/5500 — variando o que acontece depois para isolar cada gatilho.)* (depende de
  T023, T024, T025)
- [ ] T028 [US3] Validar manualmente o cenário 3 do `specs/004-sistema-pontuacao/quickstart.md`
  (bônus de combo e os três gatilhos de reset) rodando `bun run dev`

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto — sistema de
pontuação completo.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta.

- [ ] T029 Rodar a validação manual completa de `specs/004-sistema-pontuacao/quickstart.md`
  (cenários 1–4, incluindo a conferência de soma coerente da pontuação final — SC-004 — e o
  reinício após derrota pelo menos 3 vezes seguidas — FR-011) em `client/` via `bun run dev`
- [ ] T030 [P] Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte
  existente (MVP + specs 002/003) além dos novos testes de `match.score.test.ts` e
  `matchStateManager.score.test.ts`
- [ ] T031 Verificar o critério de performance SC-005 (`spec.md`) com o painel de performance do
  navegador aberto durante uma partida completa com sequências de combo: confirmar 60 FPS estável
  e nenhum atraso perceptível entre clique e remoção da barata

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup — BLOQUEIA todas as user stories
- **User Story 1 (Phase 3)**: depende de Foundational (T003, T005) — é o MVP
- **User Story 2 (Phase 4)**: depende de Foundational e de `applyEliminationScore`/
  `tryEliminateRoach` já existirem (T009/T010 da US1), pois estende a mesma função
- **User Story 3 (Phase 5)**: depende de Foundational e de US2 (T017), pois `applyEliminationScore`
  já soma base + bônus de reação antes de o combo ser adicionado
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Foundational — nenhuma dependência de outra story
- **User Story 2 (P2)**: depende de Foundational e reaproveita `applyEliminationScore`/
  `tryEliminateRoach` criados pela US1 (não é estritamente independente no código, mas é
  independentemente **testável**: dá para validar US1 sozinha antes do bônus de reação existir)
- **User Story 3 (P3)**: depende de Foundational e de US1/US2 (estende a mesma
  `applyEliminationScore`), mas é independentemente **testável**: dá para validar US1+US2 sem
  nenhum bônus de combo antes desta fase existir

### Within Each User Story

- Testes (quando incluídos) escritos e falhando antes da implementação (T007/T008→T009/T010,
  T015→T016, T020/T021→T022/T023)
- Funções puras de domínio antes da orquestração em `MatchStateManager` (T009→T010, T016→T017,
  T022→T023)
- Orquestração antes da renderização na scene (T010→T011/T012/T013, T023→T024/T025→T026)
- Story completa (incluindo validação manual) antes de avançar para a próxima prioridade

### Parallel Opportunities

- T002 (constantes) toca um arquivo diferente de T003/T004/T005 (`gameConfig.ts` vs `Match.ts`/
  `MatchStateManager.ts`/`match.hud.test.ts`), por isso é o único marcado `[P]` em Foundational
- Dentro de cada user story, as tarefas de teste marcadas `[P]` (T007+T008, T015, T020+T021) podem
  ser escritas em paralelo, já que tocam arquivos diferentes ou blocos independentes do mesmo
  arquivo de teste
- A implementação em si é majoritariamente sequencial dentro de cada story (mesmos arquivos
  compartilhados: `Match.ts`, `MatchStateManager.ts`, `GameScene.ts`)
- T030 (suíte automatizada) pode rodar em paralelo com a validação manual T029/T031

---

## Parallel Example: User Story 1

```bash
# Escrever os testes de User Story 1 em paralelo (arquivos diferentes):
Task: "Teste que falha para applyEliminationScore em client/tests/unit/match.score.test.ts"
Task: "Teste que falha para orquestração em client/tests/unit/matchStateManager.score.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T014)
5. Neste ponto já existe o item P0 equivalente do backlog original ("pontuação por barata morta"),
   agora coberto por esta spec dedicada

### Incremental Delivery

1. Setup + Foundational → base pronta
2. User Story 1 → testar independentemente → pontuação base funcional e visível
3. User Story 2 → testar independentemente → bônus de velocidade de reação
4. User Story 3 → testar independentemente → bônus de combo e seus três resets
5. Polish → validação de ponta a ponta e regressão da suíte de testes

---

## Notes

- [P] = arquivos diferentes ou blocos independentes do mesmo arquivo de teste, sem dependência
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Escrever os testes de cada story primeiro e confirmar que falham antes de implementar
- Rodar `bun test` após cada tarefa de implementação de domínio (T009, T010, T016, T017, T022,
  T023)
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
- `FR-012` (cálculo de pontuação na camada de domínio) é satisfeito por construção: todas as
  funções de pontuação (`reactionBonusPoints`, `comboBonusPoints`, `applyEliminationScore`,
  `resetComboStreak`) vivem em `entities/Match.ts`, sem import de `phaser`, testáveis via
  `bun test` isoladamente das tasks T007, T008, T015, T020, T021, T027
- `SC-004` (`/speckit-analyze`, achados I1/G1) tem cobertura dividida de propósito: T008 (US1)
  confirma a soma coerente usando apenas pontuação base (mais simples, disponível desde o MVP
  desta feature); T027 (US3) estende a mesma verificação para uma sequência mista com todos os
  bônus já implementados. Nenhuma das duas tasks depende da outra além da ordem natural das
  phases
