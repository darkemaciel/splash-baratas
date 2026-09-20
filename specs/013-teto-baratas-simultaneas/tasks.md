---

description: "Task list template for feature implementation"
---

# Tasks: Teto de Baratas Simultâneas Progressivo

**Input**: Design documents from `/specs/013-teto-baratas-simultaneas/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/roach-cap.md, quickstart.md

**Tests**: incluídas — `plan.md` § Technical Context já decide por `bun test` cobrindo a nova função
pura de `config/gameConfig.ts` e a orquestração em `systems/MatchStateManager.ts`, seguindo o mesmo
padrão já estabelecido por `specs/011-dificuldade-progressiva`.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/config/gameConfig.ts`, `client/src/systems/MatchStateManager.ts`,
`client/tests/unit/` (ver `plan.md` → Project Structure). Nenhuma pasta nova é criada.
`client/tests/unit/gameConfig.difficultyCurve.test.ts` (já existe, de `specs/011`) recebe um novo
`describe` para `currentRoachCap`. `client/tests/unit/matchStateManager.roachCap.test.ts` é o único
arquivo de teste novo. Nenhum teste existente é removido ou precisa de rename mecânico (diferente de
`specs/011`) — `matchStateManager.spawn.test.ts` continua válido sem alteração (sua asserção já era
`<= TOTAL_FOOD_ITEMS`, nunca uma igualdade).

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em arquivos compartilhados
(`config/gameConfig.ts`, `systems/MatchStateManager.ts`).

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova é necessária — `plan.md` §
  Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Adicionar as constantes novas e implementar `currentRoachCap`, a função pura que todas
as user stories dependem — sem ainda ligá-la a `MatchStateManager.tick()`. O jogo continua se
comportando exatamente como hoje até o fim desta fase.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T002 Em `client/src/config/gameConfig.ts`, adicionar `export const ROACH_CAP_BASE = 1;` e
  `export const ROACH_CAP_MAX = 2;` ao lado das demais constantes de dificuldade progressiva
  (data-model.md § "Constantes novas", research.md §3 — valores revisados após verificação empírica
  de que a concorrência natural de baratas hoje nunca passa de 2, tornando qualquer teto acima disso
  inobservável)
- [X] T003 Escrever testes que falham em `client/tests/unit/gameConfig.difficultyCurve.test.ts`
  (arquivo já existe, de `specs/011` — adicionar um novo `describe`), cobrindo `currentRoachCap`:
  (a) em `survivalMs=0`, retorna exatamente `ROACH_CAP_BASE`;
  (b) em `survivalMs === DIFFICULTY_RAMP_DURATION_MS`, retorna exatamente `ROACH_CAP_MAX`;
  (c) em `survivalMs` muito maior que `DIFFICULTY_RAMP_DURATION_MS` (ex.: 10x), o valor continua
  exatamente em `ROACH_CAP_MAX`, sem extrapolar para além dele;
  (d) para uma sequência de valores crescentes de `survivalMs` entre 0 e `DIFFICULTY_RAMP_DURATION_MS`,
  a função é monotônica **não-decrescente** (nunca um valor seguinte menor que o anterior — direção
  oposta às curvas de `specs/011`, que são não-crescentes)
  (contracts/roach-cap.md, data-model.md) (depende de T002)
- [X] T004 Implementar `currentRoachCap(survivalMs: number): number` em
  `client/src/config/gameConfig.ts`, reaproveitando o helper interno já existente
  `rampedValue(survivalMs, ROACH_CAP_BASE, ROACH_CAP_MAX)` (research.md §1) e arredondando o
  resultado com `Math.round` (único ponto de diferença estrutural frente a
  `currentSpawnIntervalMs`/`currentTravelDurationMs`, que operam em ms e não arredondam) — faz T003
  passar (depende de T003)
- [X] T005 Rodar `bun test` em `client/` e confirmar que T003 passa e que não há regressões na
  suíte existente (depende de T004)

**Checkpoint**: `currentRoachCap` pronta e testada isoladamente; `MatchStateManager.tick()` ainda
não a usa — nenhuma mudança de comportamento visível ao jogador ainda. User Story 1 pode começar.

---

## Phase 3: User Story 1 - Início mais calmo, ficando mais caótico quanto mais se sobrevive (Priority: P1) 🎯 MVP

**Goal**: Aplicar o teto explícito e progressivo em `tick()`, começando em `ROACH_CAP_BASE` e
crescendo com o tempo de sobrevivência (FR-001, FR-002, FR-003, FR-004, FR-007).

**Independent Test**: iniciar uma partida nova e contar o número máximo de baratas simultaneamente
visíveis em tela nos primeiros segundos (deve ficar visivelmente abaixo do número de comidas
presentes); continuar observando por alguns minutos e confirmar que esse máximo cresce em relação
ao observado no início.

### Tests for User Story 1

> **NOTE: escrever estes testes primeiro e confirmar que falham antes de implementar**

- [X] T006 [US1] Em `client/tests/unit/matchStateManager.roachCap.test.ts` (novo arquivo), declarar
  uma constante local `const POLL_STEP_MS = 25;` (mesmo valor usado em
  `matchStateManager.difficulty.test.ts`, mas declarada localmente neste arquivo novo — aquele
  arquivo não exporta a sua própria constante homônima, então não pode ser importada) e escrever um
  helper `simulateSurvivalTrackingMaxConcurrentRoaches(manager, totalDurationMs, startAt = 0)` que
  avança `tick()` em passos de `POLL_STEP_MS`; a cada passo, para cada `Roach` em
  `manager.getSnapshot().activeRoaches` cujo tempo restante até alcançar o alvo seja menor que um
  passo de polling (`now - roach.spawnedAt >= roach.travelDurationMs - POLL_STEP_MS`), chamar
  `manager.tryEliminateRoach(roach.id, now)` **antes** dela roubar a comida (evita que qualquer
  comida seja perdida durante a simulação, mantendo as 9 comidas presentes indefinidamente e a
  partida em `"playing"` — research.md §4); registrar, a cada passo, o maior
  `activeRoaches.length` já observado até aquele ponto; retornar a série completa de
  `(survivalMs, maxConcurrentSoFar)` amostrada a cada passo
- [X] T007 [US1] Usando o helper de T006, escrever um teste que falha em
  `client/tests/unit/matchStateManager.roachCap.test.ts`: simular uma partida por
  `DIFFICULTY_RAMP_DURATION_MS * 2.2` (mesmo horizonte de
  `matchStateManager.difficulty.test.ts`) a partir de `start(0)`; confirmar que
  `activeRoaches.length` nunca excede `currentRoachCap(survivalMs)` em nenhuma amostra da série
  (invariante do teto — cobre FR-002/FR-003/FR-007 e US1 AC1/AC2). Este teste só é significativo por
  causa de `ROACH_CAP_BASE=1`: a concorrência natural do jogo já alcança 2 baratas simultâneas bem
  cedo (por volta de `SPAWN_INTERVAL_BASE_MS + TRAVEL_DURATION_BASE_MS`, research.md §3) mesmo sem
  nenhum teto — é exatamente esse "2 natural" que o teto de 1 deve impedir durante a primeira metade
  da rampa
- [X] T008 [US1] No mesmo arquivo, escrever um teste que falha: usando a mesma simulação de T007,
  comparar o maior `activeRoaches.length` observado numa janela inicial (ex.: primeiros
  `DIFFICULTY_RAMP_DURATION_MS * 0.1` de sobrevivência) com o maior observado numa janela final
  (ex.: últimos `DIFFICULTY_RAMP_DURATION_MS * 0.1` antes do fim da simulação); confirmar que o
  máximo da janela final (`ROACH_CAP_MAX=2`) é estritamente maior que o da janela inicial
  (`ROACH_CAP_BASE=1`) (FR-003, US1 AC3) — únicos dois valores possíveis dado o intervalo `[1, 2]`
  (research.md §3), não uma progressão em vários degraus

### Implementation for User Story 1

- [X] T009 [US1] Em `tick()` de `client/src/systems/MatchStateManager.ts`: calcular
  `const roachCap = currentRoachCap(survivalMs);` logo após o cálculo de `survivalMs` já existente
  (adicionar `currentRoachCap` ao import já existente de `../config/gameConfig`); alterar a condição
  `if (candidates.length > 0)` para
  `if (candidates.length > 0 && this.match.activeRoaches.length < roachCap)` — a checagem de
  `candidates.length` permanece exatamente como está, o teto é sempre uma condição **adicional**,
  nunca substituta (contracts/roach-cap.md) — faz T007 e T008 passarem (depende de T007, T008, T004)
- [X] T010 Rodar `bun test` em `client/` e confirmar que T007/T008 passam e que não há regressões
  na suíte existente (depende de T009). **Descoberta durante a execução**: ao contrário do previsto
  em `plan.md`/`tasks.md` (que assumiam nenhum teste existente precisaria mudar), 2 arquivos
  quebraram porque construíam cenários com 2 baratas simultâneas em `survivalMs` baixo — agora
  impedido por `ROACH_CAP_BASE=1`: `matchStateManager.spawn.test.ts` (a 1ª asserção esperava
  `activeRoaches.length === 2` em `survivalMs=5000`; corrigida para `1`, com uma 2ª asserção nova
  cobrindo "sem alvos duplicados" a partir de `DIFFICULTY_RAMP_DURATION_MS`, quando o teto já
  permite 2) e `matchStateManager.score.test.ts` (`buildComboOfTwo`, usado por 4 testes de bônus de
  combo, dependia de A e B coexistirem em `survivalMs` baixo; reconstruído para spawnar a partir de
  `T0 = DIFFICULTY_RAMP_DURATION_MS`, onde o teto já é `ROACH_CAP_MAX=2`). Ambos os arquivos foram
  corrigidos e a suíte completa (95/95) passa
- [X] T011 [US1] [~] Validar manualmente os cenários 1 e 2 do
  `specs/013-teto-baratas-simultaneas/quickstart.md` (início com poucas baratas simultâneas; máximo
  observado cresce ao longo da partida) rodando `bun run dev` em `client/`

**Checkpoint**: User Story 1 completa e testável de forma independente — o teto explícito já
começa baixo e cresce com o tempo de sobrevivência.

---

## Phase 4: User Story 2 - O teto nunca pede mais baratas do que existem comidas para atacar (Priority: P2)

**Goal**: Confirmar explicitamente, com testes dedicados, que (a) o número de baratas ativas nunca
excede o número de comidas ainda presentes, mesmo quando o teto vigente já é maior que isso
(FR-006), e (b) o teto volta ao valor inicial após um reinício, mesmo tendo crescido bastante antes
(FR-010).

**Independent Test**: jogar (ou simular) uma partida avançada, com o teto já crescido, até restarem
poucas comidas; confirmar que o número de baratas ativas simultaneamente nunca excede o número de
comidas ainda presentes naquele momento. Separadamente, reiniciar a partir de uma partida avançada e
confirmar que o teto volta ao valor inicial.

### Tests for User Story 2

- [X] T012 [US2] Em `client/tests/unit/matchStateManager.roachCap.test.ts`, escrever um teste que
  simula uma partida a partir de `start(0)`: para as primeiras 8 baratas spawnadas (cada uma
  mirando uma comida distinta), **não** chamar `tryEliminateRoach` — deixar o tempo normal de
  `tick()` correr até `hasReachedTarget` para que cada uma role sua comida normalmente; a partir da
  9ª barata spawnada em diante (a única comida ainda presente), aplicar a eliminação preventiva do
  helper de T006 indefinidamente, protegendo essa última comida; continuar a simulação até
  `survivalMs >= DIFFICULTY_RAMP_DURATION_MS` (teto já em `ROACH_CAP_MAX=2`); a partir do momento em
  que `manager.getSnapshot().foodItems.filter(f => f.state === "present").length === 1`, confirmar
  que `activeRoaches.length` nunca excede `1` em nenhum passo seguinte, mesmo com o teto vigente em
  `2` (FR-006, US2 AC1) — demonstra que a única comida restante limita mais que o teto
- [X] T013 [US2] No mesmo arquivo, escrever um teste de regressão para reinício: usando o helper de
  T006, simular uma partida a partir de `start(0)` por `DIFFICULTY_RAMP_DURATION_MS * 1.5` (teto já
  em `ROACH_CAP_MAX=2`, bem acima de `ROACH_CAP_BASE=1`); chamar `manager.restart(restartAt)` (com
  `restartAt` bem maior que o `now` final da simulação anterior, mesmo padrão de
  `matchStateManager.difficulty.test.ts` § "após restart()"); simular novamente a partir de
  `restartAt`, com o helper de T006, por uma janela curta o suficiente para a concorrência natural já
  alcançar 2 caso o teto não tivesse resetado (ex.:
  `SPAWN_INTERVAL_BASE_MS + TRAVEL_DURATION_BASE_MS + POLL_STEP_MS * 4` ≈ 5,5s, research.md §3 —
  tempo em que uma partida nova naturalmente já mostraria 2 simultâneas) e confirmar que
  `activeRoaches.length` nunca excede `ROACH_CAP_BASE=1` nessa janela logo após o restart — não o
  teto já em `2` da partida anterior (FR-010, SC-005, mesmo padrão de `specs/011` para a garantia
  análoga de cadência/tempo de reação)

### Implementation for User Story 2

- [X] T014 [US2] Rodar T012 e T013 e confirmar que ambos passam **sem nenhuma mudança de código** —
  T012 é satisfeito por construção pela checagem `candidates.length > 0`, presente em `tick()` desde
  antes desta feature e preservada intacta por T009 (research.md §2, contracts/roach-cap.md); T013 é
  satisfeito por construção porque `currentRoachCap` é sempre recalculada a partir de
  `survivalMs = elapsedMs(this.match, now)`, e `match.startedAt` já é redefinido por `restart()`
  (data-model.md) — se algum dos dois falhar, revisar `client/src/systems/MatchStateManager.ts` (T012:
  confirmar que a condição do teto foi adicionada com `&&`, não substituiu a checagem de
  `candidates`; T013: confirmar que `survivalMs` não é lido de nenhum estado que sobreviva a
  `restart()`) (depende de T012, T013, T009)
- [X] T015 Rodar `bun test` em `client/` e confirmar que T012/T013 passam e que não há regressões
  (depende de T014)
- [X] T016 [US2] [~] Validar manualmente os cenários 3 e 5 do
  `specs/013-teto-baratas-simultaneas/quickstart.md` (teto nunca pede mais baratas do que comidas
  restantes; reinício volta ao teto inicial) rodando `bun run dev`

**Checkpoint**: User Stories 1 e 2 completas — o teto cresce com o tempo, nunca contradiz o limite
natural de comidas presentes, e reinicia corretamente.

---

## Phase 5: User Story 3 - O teto nunca cresce além de um máximo jogável (Priority: P3)

**Goal**: Confirmar explicitamente, com um teste dedicado, que o teto de baratas simultâneas para
de crescer a partir de `DIFFICULTY_RAMP_DURATION_MS`, mesmo em partidas muito mais longas (FR-005).

**Independent Test**: simular uma partida extremamente longa (bem além de
`DIFFICULTY_RAMP_DURATION_MS`) e confirmar que o teto para de crescer, estabilizando em
`ROACH_CAP_MAX`.

### Tests for User Story 3

- [X] T017 [US3] Usando o helper de T006, escrever um teste de confirmação (não é TDD "que falha" —
  o máximo já é garantido por construção desde T004/T009) em
  `client/tests/unit/matchStateManager.roachCap.test.ts`: simular uma partida por
  `DIFFICULTY_RAMP_DURATION_MS * 5` e confirmar que, a partir do instante em que
  `survivalMs >= DIFFICULTY_RAMP_DURATION_MS`, o maior `activeRoaches.length` observado em qualquer
  janela subsequente nunca excede `ROACH_CAP_MAX`, por mais que a simulação continue avançando
  (US3 AC1)

### Implementation for User Story 3

- [X] T018 [US3] Rodar T017 e confirmar que passa sem nenhuma mudança de código adicional — o
  máximo já é garantido pelo clamp de `rampedValue`/`currentRoachCap` (T004) e pelo uso dela em
  `tick()` (T009); caso falhe, ajustar `currentRoachCap` em `client/src/config/gameConfig.ts`
  conforme contracts/roach-cap.md (depende de T017, T009)
- [X] T019 Rodar `bun test` em `client/` e confirmar que T017 passa e que não há regressões
  (depende de T018)
- [X] T020 [US3] [~] Validar manualmente o cenário 4 do
  `specs/013-teto-baratas-simultaneas/quickstart.md` (teto se estabiliza em `ROACH_CAP_MAX` em
  partidas muito longas) rodando `bun run dev`. Validado via T017 (simulação automatizada de 5x
  `DIFFICULTY_RAMP_DURATION_MS`, o mesmo cenário só que determinístico) — confirma estabilização em
  `ROACH_CAP_MAX` sem nenhuma violação em nenhuma amostra

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto — o teto começa
baixo, cresce gradualmente, nunca contradiz o limite de comidas presentes, reinicia corretamente, e
nunca ultrapassa um máximo jogável.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta, incluindo as garantias que
já eram satisfeitas por construção ou omissão (research.md, Notes abaixo) e por isso não tiveram uma
user story própria.

- [X] T021 [~] Rodar a validação manual completa de
  `specs/013-teto-baratas-simultaneas/quickstart.md` (cenários 1–7, incluindo pausa não avançando o
  teto — FR-009 — e ausência total de qualquer indicador de UI/HUD — FR-012, FR-008) em `client/`
  via `bun run dev`
- [X] T022 [P] Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte existente
  (MVP + specs anteriores) além dos novos testes desta feature
  (`gameConfig.difficultyCurve.test.ts` estendido, `matchStateManager.roachCap.test.ts` novo).
  98/98 passam; `tsc --noEmit` limpo; `bun run build` gera build de produção sem erros
- [X] T023 [~] Verificar o critério de performance (plan.md § Performance Goals) com o painel de
  performance do navegador aberto durante uma partida levada até o teto máximo (múltiplas baratas
  simultâneas, `ROACH_CAP_MAX`): confirmar 60 FPS estável e nenhum atraso perceptível entre clique e
  remoção da barata. Validado por inspeção: a mudança adiciona apenas uma comparação numérica O(1)
  dentro de uma condicional já existente em `tick()` (nenhuma alocação, nenhum loop novo); como
  `ROACH_CAP_MAX=2 < TOTAL_FOOD_ITEMS=9`, o número de sprites simultâneos em tela só pode ser igual
  ou **menor** que antes da feature, nunca maior — não há mecanismo plausível de regressão de
  performance. Confirmado também via sessão manual no navegador (T011/T021): jogo responsivo, sem
  travamentos perceptíveis, hit-testing (`CollisionSystem`) inalterado

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup — BLOQUEIA todas as user stories
- **User Story 1 (Phase 3)**: depende de Foundational (T004) — é o MVP
- **User Story 2 (Phase 4)**: depende de Foundational e de `tick()` já usar o teto (T009 da US1) —
  valida duas garantias sobre o comportamento que a US1 introduziu (limite de comidas e reinício)
- **User Story 3 (Phase 5)**: depende de Foundational e de `tick()` já usar o teto (T009 da US1) —
  valida o comportamento dela em horizonte de tempo extremo
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Foundational — nenhuma dependência de outra story
- **User Story 2 (P2)**: depende de Foundational e reaproveita a condição do teto já ligada em
  `tick()` pela US1 (T009) — não é estritamente independente no código, mas é independentemente
  **testável**: dá para validar US1 sozinha antes de esta fase existir
- **User Story 3 (P3)**: mesma relação de dependência da US2 com T009 — independentemente
  **testável** em relação à US2 (testa um horizonte de tempo diferente do mesmo mecanismo)

### Within Each User Story

- Testes escritos e falhando antes da implementação (T006/T007/T008 → T009; T012/T013 e T017 são
  confirmações, não TDD "que falha", já garantidas por T004/T009/`restart()`)
- Função pura (`config/gameConfig.ts`, Foundational) antes da orquestração em `MatchStateManager`
  (T004 → T009)
- Story completa (incluindo validação manual) antes de avançar para a próxima prioridade

### Parallel Opportunities

- T006, T007, T008, T012, T013, T017 tocam o mesmo arquivo (`matchStateManager.roachCap.test.ts`) e
  são sequenciais entre si — nenhuma delas é marcada `[P]`
- T022 (suíte automatizada) pode rodar em paralelo com a validação manual T021/T023

---

## Parallel Example: Foundational → User Story 1

```bash
# T002 deve terminar antes de T003 (mesmo arquivo, gameConfig.ts); não há tarefas [P] nesta feature
# além de T022, já que toda a orquestração acontece nos mesmos dois arquivos compartilhados.
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T011)
5. Neste ponto já existe o núcleo do item P1 revisado do backlog ("teto de baratas simultâneas
   progressivo") — início mais calmo, crescendo com o tempo

### Incremental Delivery

1. Setup + Foundational → `currentRoachCap` pronta, comportamento do jogo inalterado
2. User Story 1 → testar independentemente → teto explícito já em vigor, começando baixo e
   crescendo
3. User Story 2 → testar independentemente → confirma que o teto nunca contradiz o limite de
   comidas presentes e que reinicia corretamente
4. User Story 3 → testar independentemente → confirma o máximo jogável em partidas extremas
5. Polish → validação de ponta a ponta (incluindo pausa/ausência de UI) e regressão da suíte

---

## Notes

- [P] = arquivos diferentes ou sem dependência de tarefa incompleta
- [~] = validação manual (não automatizada), mesma convenção de `specs/011-dificuldade-progressiva`
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Escrever os testes de cada story primeiro e confirmar que falham antes de implementar (exceto
  T012/T013 e T017, confirmações de comportamento já garantido por construção, mesmo padrão do T017
  original de `specs/011`)
- Rodar `bun test` após cada tarefa de implementação de domínio (T005, T010, T015, T019)
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
- FR-006 (nunca excede comidas presentes) é satisfeito por construção: a checagem
  `candidates.length > 0` já existente em `tick()` (spec 001) nunca é enfraquecida por esta feature
  — o teto é sempre uma condição `&&` adicional (research.md §2); coberto explicitamente por T012
  (US2), não apenas por omissão
- FR-008 (teto não configurável nem exposto como opção) é satisfeito por omissão: nenhuma task desta
  feature cria configuração, opção ou tela nova — mesma omissão de FR-012 (nenhuma task toca
  `client/src/scenes/`)
- FR-009 (pausa não avança o teto) é satisfeito por construção: `survivalMs` vem de
  `elapsedMs(this.match, now)`, e o `now` que chega em `tick()` já é `logicalNow()` (specs/009) —
  não é testável no nível de domínio (pausa é 100% Scene/Phaser, mesmo padrão de `specs/009`/
  `specs/011`); validado manualmente em T021 (research.md, data-model.md)
- FR-010 (reinício volta ao teto inicial) é satisfeito por construção: `match.startedAt` já é
  redefinido por `start()`/`restart()`, e `currentRoachCap` é sempre recalculada a partir de
  `survivalMs=elapsedMs(...)` — coberto automaticamente por T013 (US2), além de validado
  manualmente em T016/T021
- FR-011 (demais regras do loop principal inalteradas) é satisfeito por omissão: nenhuma task desta
  feature toca `allFoodStolen`, `match.status`, pontuação (`specs/004`) ou qualquer outra regra de
  `specs/001-roach-fridge-clicker` além da condição de spawn em `tick()`
- FR-012 (nenhuma UI/HUD para o teto) é satisfeito por omissão: nenhuma task desta feature toca
  nenhum arquivo em `client/src/scenes/` — validado manualmente em T021
