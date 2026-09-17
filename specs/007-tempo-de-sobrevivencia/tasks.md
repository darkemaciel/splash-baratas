---

description: "Task list template for feature implementation"
---

# Tasks: Cronômetro de Tempo de Sobrevivência

**Input**: Design documents from `/specs/007-tempo-de-sobrevivencia/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/domain-api-timer.md,
quickstart.md

**Tests**: incluídas — `research.md` §8 e o campo `Testing` de `plan.md` já decidem por `bun test`
cobrindo as novas funções puras de domínio (`elapsedMs`, `formatElapsedTime`) e a orquestração em
`MatchStateManager`, seguindo o padrão já estabelecido pelo MVP e por `004-sistema-pontuacao`.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/`, `client/tests/unit/` (ver `plan.md` → Project Structure). Nenhuma
pasta nova é criada; todos os arquivos abaixo já existem (MVP + specs 002/004/005/006), exceto
`client/tests/unit/match.timer.test.ts` e `client/tests/unit/matchStateManager.timer.test.ts`, que
são novos.

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em arquivos compartilhados
(`entities/Match.ts`, `systems/MatchStateManager.ts`, `scenes/GameScene.ts`,
`scenes/GameOverScene.ts`).

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente (MVP + specs
  002/003/004/005/006) passa antes de iniciar qualquer alteração (baseline; nenhuma dependência
  nova é necessária — `plan.md` § Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Campos de estado (`startedAt`, `endedAt`) e a extensão de `MatchSnapshot` que
**todas** as user stories desta feature precisam, sem ainda nenhum comportamento de cronômetro
visível.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T002 Adicionar os campos `startedAt: number` e `endedAt: number | null` à interface `Match`
  em `client/src/entities/Match.ts`; mudar a assinatura de `createMatch()` para
  `createMatch(now: number = Date.now()): Match`, fixando `startedAt: now, endedAt: null`; em
  `createEmptyMatch()`, fixar `startedAt: 0, endedAt: null` (data-model.md § "Campos adicionados a
  Match", research.md §1/§2)
- [X] T003 Em `start(now)` de `client/src/systems/MatchStateManager.ts`, trocar
  `this.match = createMatch()` por `this.match = createMatch(now)`, para que `startedAt` reflita
  o `now` recebido pelo método em vez de `Date.now()` interno de `createMatch` (contracts/
  domain-api-timer.md) (depende de T002)
- [X] T004 [P] Atualizar o helper `matchWithRemaining` em `client/tests/unit/match.hud.test.ts`
  para incluir `startedAt: 0, endedAt: null` no objeto `Match` literal que ele constrói, já que
  esses campos passam a ser obrigatórios na interface (data-model.md § "Impacto em testes
  existentes") (depende de T002)
- [X] T005 Estender a interface `MatchSnapshot` em `client/src/systems/MatchStateManager.ts` com
  `readonly startedAt: number` e `readonly endedAt: number | null`, calculados em `getSnapshot()`
  como cópia direta de `match.startedAt`/`match.endedAt` (contracts/domain-api-timer.md) (depende
  de T003)
- [X] T006 Rodar `bun test` em `client/` e confirmar zero regressões após T002–T005 (a suíte
  existente deve compilar e passar com os novos campos do `Match`) (depende de T004, T005)

**Checkpoint**: `Match`/`MatchSnapshot` já carregam `startedAt`/`endedAt`; nenhuma exibição de
cronômetro existe ainda — User Story 1 pode começar.

---

## Phase 3: User Story 1 - Ver o tempo de sobrevivência durante a partida (Priority: P1) 🎯 MVP

**Goal**: Exibir um cronômetro na tela de jogo que começa em zero no início da partida e avança
continuamente e de forma legível enquanto a partida está em andamento, sem aparecer na tela inicial
(FR-001, FR-002, FR-003, FR-007).

**Independent Test**: iniciar uma partida e confirmar que o cronômetro aparece em `00:00` no exato
momento em que a tela de jogo é exibida, avança de forma contínua e legível por pelo menos 10
segundos sem travar/saltar, e não aparece na tela inicial antes de "Iniciar".

### Tests for User Story 1

> **NOTE: escrever estes testes primeiro e confirmar que falham antes de implementar**

- [X] T007 [P] [US1] Escrever testes que falham para `elapsedMs` (caso partida em andamento —
  `endedAt: null`, retorna `now - startedAt`) e para `formatElapsedTime` (`0` → `"00:00"`, `5000` →
  `"00:05"`, `65000` → `"01:05"`, `599000` → `"09:59"`, `600000` → `"10:00"`, e `3661000` →
  `"61:01"` para confirmar ausência de rollover para horas em partidas de "dezenas de minutos" —
  Edge Case da spec, FR-008) em `client/tests/unit/match.timer.test.ts` (novo arquivo)
  (data-model.md § "Funções puras adicionadas", research.md §6/§8)
- [X] T008 [P] [US1] Escrever teste que falha para a orquestração em
  `client/tests/unit/matchStateManager.timer.test.ts` (novo arquivo): `start(now)` faz
  `getSnapshot().startedAt === now` e `getSnapshot().endedAt === null` (contracts/
  domain-api-timer.md)

### Implementation for User Story 1

- [X] T009 [US1] Implementar `elapsedMs(match, now)` e `formatElapsedTime(ms)` em
  `client/src/entities/Match.ts` (data-model.md § "Funções puras adicionadas") — faz T007 passar
  (depende de T007, T002)
- [X] T010 [US1] Em `client/src/scenes/GameScene.ts`: adicionar constante `HUD_MARGIN_LEFT`
  (espelhando `HUD_MARGIN_RIGHT`/`HUD_MARGIN_TOP` já existentes) e, em `create()`, criar
  `Phaser.GameObjects.Text` (`timerText`) ancorado no canto superior esquerdo (`origin(0, 0)`,
  mesma fonte/tamanho do HUD — `HUD_FONT_FAMILY`/`HUD_FONT_SIZE_PX`), inicializado com
  `formatElapsedTime(elapsedMs(snapshot, this.time.now))`; inicializar também um novo campo
  privado `lastRenderedElapsedSeconds` fixado em `0` nesse mesmo ponto de `create()` (para não
  reter o valor de uma partida anterior após um restart — ver User Story 3) (depende de T009,
  T005)
- [X] T011 [US1] Em `update()` de `client/src/scenes/GameScene.ts`, recalcular
  `elapsedMs(matchStateManager.getSnapshot(), this.time.now)` a cada frame, mas só chamar
  `timerText.setText(formatElapsedTime(elapsed))` quando `Math.floor(elapsed / 1000)` for
  diferente de `this.lastRenderedElapsedSeconds` — atualizando `lastRenderedElapsedSeconds` nesse
  caso (research.md §7: throttle de redraw a 1x/s) (depende de T010)
- [ ] T012 [US1] Validar manualmente o cenário 1 do
  `specs/007-tempo-de-sobrevivencia/quickstart.md` (ver o cronômetro durante a partida, incluindo
  a ausência de cronômetro na tela inicial) rodando `bun run dev` em `client/`

**Checkpoint**: User Story 1 completa e testável de forma independente — cronômetro visível,
iniciando em zero e avançando continuamente durante a partida.

---

## Phase 4: User Story 2 - Cronômetro para ao fim da partida (Priority: P2)

**Goal**: No instante exato em que a última comida é roubada, o cronômetro para de avançar e o
valor final de sobrevivência permanece visível e estático na tela de fim de jogo (FR-004, FR-005).

**Independent Test**: jogar até que todas as comidas sejam roubadas, anotar o valor exibido nesse
instante, e confirmar que o cronômetro não avança mais e que a tela de fim de jogo mostra
exatamente esse mesmo valor, sem mudar enquanto a tela estiver aberta.

### Tests for User Story 2

- [X] T013 [P] [US2] Escrever teste de confirmação (não é TDD "que falha" — `elapsedMs` já foi
  implementado por completo, incluindo este ramo, em T009) para `elapsedMs` no caso de partida
  encerrada (`endedAt` definido, retorna `endedAt - startedAt` e ignora o `now` recebido) em
  `client/tests/unit/match.timer.test.ts` (data-model.md § "Regras de validação") — funciona como
  teste de regressão para este ramo, já que a orquestração que efetivamente define `endedAt`
  (T015) ainda não existe neste ponto
- [X] T014 [P] [US2] Escrever teste que falha para a orquestração em
  `client/tests/unit/matchStateManager.timer.test.ts`: o `tick(now)` que rouba a última comida
  (todas as comidas ficam `stolen`) faz `getSnapshot().endedAt === now` exatamente, e uma chamada
  de `tick()` posterior com um `now` maior não altera mais esse valor (contracts/
  domain-api-timer.md, FR-004)

### Implementation for User Story 2

- [X] T015 [US2] Em `tick(now)` de `client/src/systems/MatchStateManager.ts`, no branch onde
  `allFoodStolen(this.match)` se torna verdadeiro, definir `this.match.endedAt = now` antes de
  `this.match.status = "lost"` e de `this.emit("match:lost", ...)` — faz T013/T014 passarem
  (depende de T014, T009, T005)
- [X] T016 [US2] Em `create()` de `client/src/scenes/GameOverScene.ts`, ler
  `matchStateManager.getSnapshot()`, calcular
  `formatElapsedTime(elapsedMs(snapshot, this.time.now))` e exibir como um novo
  `Phaser.GameObjects.Text` estático com o texto `"Tempo de sobrevivência: {valor}"`, posicionado
  entre a mensagem de derrota existente e a pontuação final já exibida (specs/004), ajustando os
  deslocamentos verticais dos textos existentes conforme necessário para não sobrepor (FR-005)
  (depende de T015)
- [ ] T017 [US2] Validar manualmente o cenário 2 do
  `specs/007-tempo-de-sobrevivencia/quickstart.md` (cronômetro para ao fim da partida e valor
  final na tela de fim de jogo) rodando `bun run dev`

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente — cronômetro conta durante a
partida e congela corretamente ao final.

---

## Phase 5: User Story 3 - Cronômetro reinicia em nova partida (Priority: P3)

**Goal**: Ao iniciar uma nova partida, o cronômetro volta a zero e passa a contar de forma
independente do valor da partida anterior (FR-006).

**Independent Test**: terminar uma partida com um tempo de sobrevivência final não-zero, iniciar
uma nova partida a partir da tela de fim de jogo, e confirmar que o cronômetro reinicia em `00:00`
antes de qualquer barata surgir, contando de forma independente da partida anterior; repetir o
ciclo (derrota → reiniciar) pelo menos 3 vezes seguidas.

### Tests for User Story 3

- [X] T018 [P] [US3] Escrever teste que falha para a orquestração em
  `client/tests/unit/matchStateManager.timer.test.ts`: após uma partida com `endedAt` definido,
  `restart(newNow)` faz `getSnapshot().startedAt === newNow` e `getSnapshot().endedAt === null`,
  independentemente dos valores da partida anterior (FR-006, SC-004 da spec)

### Implementation for User Story 3

- [X] T019 [US3] Rodar T018 e confirmar que passa sem nenhuma mudança de código adicional —
  `restart()` já delega para `start(now)` (que já fixa `startedAt`/`endedAt` via T002/T003); caso
  T018 falhe, ajustar `restart()` em `client/src/systems/MatchStateManager.ts` conforme
  research.md §5 (depende de T018, T015)
- [ ] T020 [US3] Validar manualmente o cenário 3 do
  `specs/007-tempo-de-sobrevivencia/quickstart.md` (reinício zera o cronômetro, repetido pelo
  menos 3 vezes seguidas) rodando `bun run dev` — confirmar em particular que `timerText` não
  exibe por um instante o último valor da partida anterior antes de zerar (valida o reset de
  `lastRenderedElapsedSeconds` feito em T010)

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto — cronômetro
completo (exibe, para, reinicia).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta.

- [ ] T021 Rodar a validação manual completa de
  `specs/007-tempo-de-sobrevivencia/quickstart.md` (cenários 1–6, incluindo a checagem de
  precisão SC-002 com um relógio externo e o comportamento de perda/recuperação de foco da aba —
  cenário 6, Edge Case da spec) em `client/` via `bun run dev`
- [X] T022 [P] Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte
  existente (MVP + specs 002/003/004/005/006) além dos novos testes de `match.timer.test.ts` e
  `matchStateManager.timer.test.ts`
- [ ] T023 Verificar o critério de performance (plan.md § Performance Goals) com o painel de
  performance do navegador aberto durante uma partida completa com o cronômetro em execução:
  confirmar 60 FPS estável e nenhum atraso perceptível entre clique e remoção da barata

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup — BLOQUEIA todas as user stories
- **User Story 1 (Phase 3)**: depende de Foundational (T002, T003, T005) — é o MVP
- **User Story 2 (Phase 4)**: depende de Foundational e de `elapsedMs`/`timerText` já existirem
  (T009/T010 da US1), pois reaproveita a mesma função e o mesmo objeto de texto
- **User Story 3 (Phase 5)**: depende de Foundational e de US2 (T015), já que valida o reset de
  `endedAt` depois de uma partida efetivamente encerrada
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Foundational — nenhuma dependência de outra story
- **User Story 2 (P2)**: depende de Foundational e reaproveita `elapsedMs`/`formatElapsedTime`
  criados pela US1 (não é estritamente independente no código, mas é independentemente
  **testável**: dá para validar US1 sozinha antes de a derrota congelar o valor)
- **User Story 3 (P3)**: depende de Foundational e de US1/US2 (precisa de uma partida encerrada
  com `endedAt` definido para validar o reset), mas é independentemente **testável**: dá para
  validar US1+US2 sem nenhum reinício antes desta fase existir

### Within Each User Story

- Testes (quando incluídos) escritos e falhando antes da implementação (T007/T008→T009/T010,
  T013/T014→T015, T018→T019)
- Funções puras de domínio antes da orquestração em `MatchStateManager` (T009→T010, T015)
- Orquestração antes da renderização na scene (T005→T010, T015→T016)
- Story completa (incluindo validação manual) antes de avançar para a próxima prioridade

### Parallel Opportunities

- T004 (helper de teste) toca um arquivo diferente de T003/T005 (`match.hud.test.ts` vs
  `MatchStateManager.ts`), por isso é o único marcado `[P]` em Foundational
- Dentro de cada user story, as tarefas de teste marcadas `[P]` (T007+T008, T013+T014) podem ser
  escritas em paralelo, já que tocam arquivos diferentes ou blocos independentes do mesmo arquivo
  de teste
- A implementação em si é majoritariamente sequencial dentro de cada story (mesmos arquivos
  compartilhados: `Match.ts`, `MatchStateManager.ts`, `GameScene.ts`)
- T022 (suíte automatizada) pode rodar em paralelo com a validação manual T021/T023

---

## Parallel Example: User Story 1

```bash
# Escrever os testes de User Story 1 em paralelo (arquivos diferentes):
Task: "Testes que falham para elapsedMs/formatElapsedTime em client/tests/unit/match.timer.test.ts"
Task: "Teste que falha para orquestração em client/tests/unit/matchStateManager.timer.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T012)
5. Neste ponto já existe o item P0 equivalente do backlog original ("cronômetro de tempo de
   sobrevivência"), agora coberto por esta spec dedicada

### Incremental Delivery

1. Setup + Foundational → base pronta
2. User Story 1 → testar independentemente → cronômetro visível e contando
3. User Story 2 → testar independentemente → cronômetro para e mostra valor final
4. User Story 3 → testar independentemente → cronômetro reinicia em nova partida
5. Polish → validação de ponta a ponta e regressão da suíte de testes

---

## Notes

- [P] = arquivos diferentes ou blocos independentes do mesmo arquivo de teste, sem dependência
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Escrever os testes de cada story primeiro e confirmar que falham antes de implementar
- Rodar `bun test` após cada tarefa de implementação de domínio (T009, T015)
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
- FR-001/FR-002/FR-003 (cálculo do tempo decorrido na camada de domínio) são satisfeitos por
  construção: `elapsedMs`/`formatElapsedTime` vivem em `entities/Match.ts`, sem import de
  `phaser`, testáveis via `bun test` isoladamente (T007, T013)
- FR-007 (cronômetro não aparece na tela inicial) é satisfeito por construção: `StartScene` nunca
  cria nenhum `Text` relacionado ao cronômetro — só `GameScene`/`GameOverScene` o fazem (validado
  manualmente em T012)
- FR-009 (sem pontuação adicional, dificuldade progressiva ou persistência de recorde) é satisfeito
  por omissão: nenhuma task desta feature (T001–T023) introduz qualquer um desses elementos — não
  há task dedicada a FR-009 porque não há nada a construir, apenas a não construir
