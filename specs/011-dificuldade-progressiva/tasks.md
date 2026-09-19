---

description: "Task list template for feature implementation"
---

# Tasks: Dificuldade Progressiva

**Input**: Design documents from `/specs/011-dificuldade-progressiva/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/difficulty-curve.md, quickstart.md

**Tests**: incluídas — `plan.md` § Technical Context já decide por `bun test` cobrindo as novas
funções puras de `config/gameConfig.ts` e a orquestração em `systems/MatchStateManager.ts`,
seguindo o mesmo padrão já estabelecido por `specs/007-tempo-de-sobrevivencia`/
`specs/010-variacao-pontos-spawn`.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/config/gameConfig.ts`, `client/src/systems/MatchStateManager.ts`,
`client/tests/unit/` (ver `plan.md` → Project Structure). Nenhuma pasta nova é criada;
`client/tests/unit/gameConfig.difficultyCurve.test.ts` e
`client/tests/unit/matchStateManager.difficulty.test.ts` são os únicos arquivos novos.
`client/tests/unit/matchStateManager.constants.test.ts` é removido (US2 — testava exatamente a
garantia de `FR-016` da spec 001 que esta feature substitui). Todo o restante é edição aditiva
sobre arquivos já existentes.

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em arquivos compartilhados
(`config/gameConfig.ts`, `systems/MatchStateManager.ts`).

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova é necessária — `plan.md` §
  Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Renomear as constantes fixas para refletir seu novo papel de "valor base", adicionar
os pisos e a duração da rampa, e implementar as duas funções puras de curva — sem ainda ligá-las a
`MatchStateManager.tick()`. O jogo continua se comportando exatamente como hoje até o fim desta
fase (`tick()` continua lendo os valores base diretamente, agora só com nomes novos). Todas as três
user stories dependem deste conjunto de constantes/funções.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T002 Em `client/src/config/gameConfig.ts`: renomear `SPAWN_INTERVAL_MS` para
  `SPAWN_INTERVAL_BASE_MS` e `TRAVEL_DURATION_MS` para `TRAVEL_DURATION_BASE_MS` (mesmos valores,
  2500 e 3000 — renomeação pura, sem mudança de comportamento); adicionar
  `SPAWN_INTERVAL_FLOOR_MS = 1200`, `TRAVEL_DURATION_FLOOR_MS = 2000` e
  `DIFFICULTY_RAMP_DURATION_MS = 180_000` (data-model.md § "Constantes renomeadas/adicionadas",
  research.md §2)
- [X] T003 Em `client/src/systems/MatchStateManager.ts`, atualizar o import e os 2 usos de
  `SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS` para `SPAWN_INTERVAL_BASE_MS`/`TRAVEL_DURATION_BASE_MS`
  — renomeação mecânica, `tick()` continua lendo os valores base diretamente (sem chamar nenhuma
  função de curva ainda) (depende de T002)
- [X] T004 [P] Atualizar o import de `SPAWN_INTERVAL_MS` para `SPAWN_INTERVAL_BASE_MS` em
  `client/tests/unit/matchStateManager.spawn.test.ts`,
  `client/tests/unit/matchStateManager.spawnVariety.test.ts` e
  `client/tests/unit/matchStateManager.spawnCoherence.test.ts` — renomeação mecânica; esses testes
  usam a constante só como passo fixo para avançar `tick()` em seus próprios loops, nenhuma
  asserção muda (research.md §6); em `matchStateManager.spawn.test.ts`, ajustar também a string do
  teste de "uma nova barata surge a cada SPAWN_INTERVAL_MS..." para "uma nova barata surge no
  máximo a cada SPAWN_INTERVAL_BASE_MS..." — após esta feature a cadência real pode ficar mais
  rápida que a base com o tempo, então "a cada" deixa de ser preciso (depende de T002)
- [X] T005 Escrever testes que falham em `client/tests/unit/gameConfig.difficultyCurve.test.ts`
  (novo arquivo) cobrindo `currentSpawnIntervalMs`/`currentTravelDurationMs`:
  (a) em `survivalMs=0`, cada função retorna exatamente seu valor base
  (`SPAWN_INTERVAL_BASE_MS`/`TRAVEL_DURATION_BASE_MS`);
  (b) em `survivalMs === DIFFICULTY_RAMP_DURATION_MS`, cada função retorna exatamente seu piso
  (`SPAWN_INTERVAL_FLOOR_MS`/`TRAVEL_DURATION_FLOOR_MS`);
  (c) em `survivalMs` muito maior que `DIFFICULTY_RAMP_DURATION_MS` (ex.: 10x), o valor continua
  exatamente no piso, sem extrapolar para além dele;
  (d) para uma sequência de valores crescentes de `survivalMs` entre 0 e o piso, cada função é
  monotônica não-crescente (nunca um valor seguinte maior que o anterior)
  (contracts/difficulty-curve.md, research.md §1) (depende de T002)
- [X] T006 Implementar `currentSpawnIntervalMs(survivalMs: number): number` e
  `currentTravelDurationMs(survivalMs: number): number` em `client/src/config/gameConfig.ts`,
  usando a interpolação linear `t = clamp(survivalMs / DIFFICULTY_RAMP_DURATION_MS, 0, 1)`,
  `valor = base + (piso - base) * t` (research.md §1) — faz T005 passar (depende de T005)
- [X] T007 Rodar `bun test` em `client/` e confirmar que os testes de T005 passam e que não há
  regressões na suíte existente (depende de T003, T004, T006)

**Checkpoint**: `currentSpawnIntervalMs`/`currentTravelDurationMs` prontas e testadas;
`MatchStateManager.tick()` continua usando os valores base diretamente (agora com os novos nomes)
— nenhuma mudança de comportamento visível ao jogador ainda. User Story 1 pode começar.

---

## Phase 3: User Story 1 - Baratas aparecem com mais frequência quanto mais tempo se sobrevive (Priority: P1) 🎯 MVP

**Goal**: Diminuir gradualmente o intervalo entre spawns de baratas conforme o tempo de
sobrevivência avança (FR-001, FR-003).

**Independent Test**: jogar (ou simular) uma partida por vários minutos sem perder, comparando o
intervalo entre spawns no primeiro minuto com o de um minuto mais avançado; confirmar que o
intervalo fica perceptivelmente menor conforme o tempo de sobrevivência avança.

### Tests for User Story 1

> **NOTE: escrever este teste primeiro e confirmar que falha antes de implementar**

- [X] T008 [US1] Escrever teste que falha em
  `client/tests/unit/matchStateManager.difficulty.test.ts` (novo arquivo): criar um
  `MatchStateManager`, chamar `start(0)`, escutar `"roach:spawned"` para registrar o `spawnedAt` de
  cada barata e chamar `tryEliminateRoach(roach.id, roach.spawnedAt)` imediatamente após cada spawn
  (mantém a partida em andamento indefinidamente, como em `specs/010`); avançar `tick()` em passos
  pequenos e fixos (ex.: 25ms) por um tempo simulado bem maior que `DIFFICULTY_RAMP_DURATION_MS`
  (ex.: 400000ms); calcular o intervalo entre os 2 primeiros spawns registrados (próximo de
  `survivalMs=0`) e o intervalo entre os 2 últimos spawns registrados (próximo do fim da simulação);
  confirmar que o primeiro intervalo está próximo de `SPAWN_INTERVAL_BASE_MS` (dentro de uma
  margem de poucos passos de polling) e o último está próximo de `SPAWN_INTERVAL_FLOOR_MS`, com o
  último sendo estritamente menor que o primeiro (FR-001, FR-003, spec.md US1 AC1)

### Implementation for User Story 1

- [X] T009 [US1] Em `tick()` de `client/src/systems/MatchStateManager.ts`: calcular
  `const survivalMs = elapsedMs(this.match, now);` (adicionar `elapsedMs` ao import já existente de
  `../entities/Match`) logo no início do método; substituir a condição de cadência
  `now - this.lastSpawnAt >= SPAWN_INTERVAL_BASE_MS` por
  `now - this.lastSpawnAt >= currentSpawnIntervalMs(survivalMs)` (adicionar
  `currentSpawnIntervalMs` ao import de `../config/gameConfig`) — faz T008 passar (depende de T008,
  T006)
- [X] T010 Rodar `bun test` em `client/` e confirmar que T008 passa e que não há regressões
  (depende de T009; `matchStateManager.constants.test.ts` já não existe neste ponto — ver nota em
  T013 sobre a exclusão ter sido adiantada para T002/T003)
- [~] T011 [US1] Validar manualmente o cenário 1 do
  `specs/011-dificuldade-progressiva/quickstart.md` (cadência de spawn aumenta perceptivelmente ao
  longo de uma partida de 3+ minutos) rodando `bun run dev` em `client/`

**Checkpoint**: User Story 1 completa e testável de forma independente — cadência de spawn já
aumenta com o tempo de sobrevivência; tempo de viagem ainda fixo.

---

## Phase 4: User Story 2 - Tempo de reação diminui conforme a partida avança (Priority: P2)

**Goal**: Diminuir gradualmente o tempo de viagem de baratas recém-criadas conforme o tempo de
sobrevivência avança, sem afetar baratas já em trajeto (FR-002, FR-007).

**Independent Test**: comparar, em momentos diferentes de uma mesma partida, quanto tempo uma
barata recém-surgida leva para alcançar seu alvo; confirmar que esse tempo fica perceptivelmente
menor conforme a partida avança.

### Tests for User Story 2

- [X] T012 [US2] Escrever testes que falham em
  `client/tests/unit/matchStateManager.difficulty.test.ts` (arquivo criado em T008): (a) com o
  mesmo mecanismo de simulação de T008, registrar `roach.travelDurationMs` de cada barata spawnada
  (via `"roach:spawned"`) junto com o `survivalMs` no momento do spawn; confirmar que o
  `travelDurationMs` da primeira barata está próximo de `TRAVEL_DURATION_BASE_MS`, o da última está
  próximo de `TRAVEL_DURATION_FLOOR_MS`, e o último é estritamente menor que o primeiro (FR-002,
  spec.md US2 AC1); (b) tomar uma barata específica logo após seu spawn e ler seu
  `travelDurationMs` em `getSnapshot()` em dois instantes diferentes antes de ela alcançar o alvo;
  confirmar que o valor não muda entre as duas leituras, mesmo que `survivalMs` tenha avançado
  nesse meio-tempo (FR-007, spec.md US2 AC2); (c) após a dificuldade já ter avançado visivelmente
  (ex.: repetir o mecanismo de simulação por tempo suficiente para o intervalo/tempo de viagem
  observados já estarem visivelmente abaixo dos valores base), chamar `manager.restart(now2)` e
  confirmar que o próximo spawn após o restart usa um intervalo e um `travelDurationMs` próximos
  dos valores base novamente — não dos valores já degradados da partida anterior (FR-005, SC-004,
  spec.md Edge Cases "reinício")
- [X] T013 [US2] Excluir `client/tests/unit/matchStateManager.constants.test.ts` — ele testava
  exatamente a garantia de `FR-016` da spec 001 ("`SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS` não
  mudam entre o primeiro e o último spawn de uma partida"), que esta feature substitui
  deliberadamente (spec.md → Assumptions, research.md §6); a cobertura ainda válida daquele teste
  (valor igual ao base em `survivalMs=0`) já está em `gameConfig.difficultyCurve.test.ts` (T005).
  **Executada adiantada, durante T002/T003**: o rename das constantes já quebrava a compilação
  deste arquivo antes mesmo de a User Story 2 existir, então a exclusão não podia esperar sem
  deixar a suíte quebrada por 2 fases inteiras — descoberta de sequenciamento durante a
  implementação, sem impacto no resultado final previsto pela task

### Implementation for User Story 2

- [X] T014 [US2] Em `tick()` de `client/src/systems/MatchStateManager.ts`, substituir
  `createRoach(..., TRAVEL_DURATION_BASE_MS)` por
  `createRoach(..., currentTravelDurationMs(survivalMs))`, reaproveitando o `survivalMs` já
  calculado em T009 (adicionar `currentTravelDurationMs` ao import de `../config/gameConfig`) —
  faz T012 passar (depende de T012, T009, T006)
- [X] T015 Rodar `bun test` em `client/` e confirmar que T012 passa, que a exclusão de T013 não
  deixou nenhuma referência quebrada, e que não há regressões (depende de T013, T014)
- [~] T016 [US2] Validar manualmente o cenário 2 do
  `specs/011-dificuldade-progressiva/quickstart.md` (tempo de reação diminui perceptivelmente ao
  longo da partida; barata já em voo não é afetada retroativamente) rodando `bun run dev`

**Checkpoint**: User Stories 1 e 2 completas — cadência e tempo de reação ambos aumentam a
dificuldade com o tempo, sem afetar baratas já em trajeto.

---

## Phase 5: User Story 3 - Dificuldade nunca ultrapassa um limite jogável (Priority: P3)

**Goal**: Confirmar explicitamente, com um teste dedicado de integração, que cadência de spawn e
tempo de viagem nunca ultrapassam seus pisos mínimos, mesmo em partidas muito mais longas que o
horizonte de progressão (FR-004).

**Independent Test**: simular uma partida extremamente longa e confirmar que, a partir de um certo
ponto, tanto a cadência de spawn quanto o tempo de reação param de diminuir, estabilizando nos
pisos.

### Tests for User Story 3

- [X] T017 [US3] Escrever teste de confirmação (não é TDD "que falha" — o piso já é garantido por
  construção desde T006/T009/T014) em `client/tests/unit/matchStateManager.difficulty.test.ts`:
  reaproveitando o mecanismo de simulação de T008/T012, avançar a partida por um tempo simulado
  várias vezes maior que `DIFFICULTY_RAMP_DURATION_MS` (ex.: 5x) e confirmar que, a partir do
  instante em que `survivalMs >= DIFFICULTY_RAMP_DURATION_MS`, nenhum intervalo entre spawns fica
  menor que `SPAWN_INTERVAL_FLOOR_MS` e nenhum `travelDurationMs` fica menor que
  `TRAVEL_DURATION_FLOOR_MS` (dentro da margem de polling), por mais que a simulação continue
  avançando (spec.md US3 AC1/AC2)

### Implementation for User Story 3

- [X] T018 [US3] Rodar T017 e confirmar que passa sem nenhuma mudança de código adicional — o piso
  já é garantido pelo `clamp` de `currentSpawnIntervalMs`/`currentTravelDurationMs` (T006) e pelo
  uso delas em `tick()` (T009, T014); caso falhe, ajustar o `clamp` em
  `client/src/config/gameConfig.ts` conforme contracts/difficulty-curve.md (depende de T017, T009,
  T014)
- [~] T019 [US3] Validar manualmente o cenário 3 do
  `specs/011-dificuldade-progressiva/quickstart.md` (cadência e tempo de reação se estabilizam em
  partidas muito longas) rodando `bun run dev`

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto — dificuldade
aumenta gradualmente e nunca ultrapassa um piso jogável.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta, incluindo as garantias que
já eram satisfeitas por construção (research.md §4/§5) e por isso não tiveram uma user story
própria.

- [~] T020 Rodar a validação manual completa de
  `specs/011-dificuldade-progressiva/quickstart.md` (cenários 1–6, incluindo reinício voltando ao
  ritmo inicial — FR-005 —, pausa não avançando a dificuldade — FR-006 — e pontuação/combo
  inalterados — FR-009) em `client/` via `bun run dev`
- [X] T021 [P] Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte existente
  (MVP + specs anteriores) além dos novos testes desta feature
  (`gameConfig.difficultyCurve.test.ts`, `matchStateManager.difficulty.test.ts`) e da remoção de
  `matchStateManager.constants.test.ts`
- [~] T022 Verificar o critério de performance (plan.md § Performance Goals) com o painel de
  performance do navegador aberto durante uma partida levada até a dificuldade máxima (múltiplas
  baratas simultâneas, cadência no piso): confirmar 60 FPS estável e nenhum atraso perceptível
  entre clique e remoção da barata

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup — BLOQUEIA todas as user stories
- **User Story 1 (Phase 3)**: depende de Foundational (T006) — é o MVP
- **User Story 2 (Phase 4)**: depende de Foundational (T006) e do `survivalMs` já calculado em
  `tick()` pela US1 (T009), que reaproveita
- **User Story 3 (Phase 5)**: depende de Foundational e de `tick()` já usar as duas funções de
  curva (T009 da US1, T014 da US2), já que valida o comportamento delas em conjunto sob tempo de
  sobrevivência extremo
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Foundational — nenhuma dependência de outra story
- **User Story 2 (P2)**: depende de Foundational e reaproveita o `survivalMs` calculado pela US1 em
  `tick()` (não é estritamente independente no código, mas é independentemente **testável**: dá
  para validar US1 sozinha, com tempo de viagem ainda fixo, antes desta fase existir)
- **User Story 3 (P3)**: depende de Foundational e das duas chamadas de função já ligadas em
  `tick()` pelas US1/US2, mas é independentemente **testável**: dá para validar US1+US2 num
  horizonte de tempo comum antes de confirmar o comportamento em horizontes extremos

### Within Each User Story

- Testes escritos e falhando antes da implementação (T008→T009, T012→T014, T017→T018
  (confirmação))
- Constantes/funções puras (`config/gameConfig.ts`, Foundational) antes da orquestração em
  `MatchStateManager` (T006 → T009, T014)
- Story completa (incluindo validação manual) antes de avançar para a próxima prioridade

### Parallel Opportunities

- T004 (rename mecânico em 3 arquivos de teste de specs anteriores) pode rodar em paralelo com T003
  (rename em `MatchStateManager.ts`) — arquivos diferentes, mesma dependência (T002)
- T008, T012 e T017 tocam o mesmo arquivo (`matchStateManager.difficulty.test.ts`) e são
  sequenciais entre si — nenhuma delas é marcada `[P]`
- T021 (suíte automatizada) pode rodar em paralelo com a validação manual T020/T022

---

## Parallel Example: Foundational

```bash
# Podem rodar ao mesmo tempo, uma vez que T002 esteja pronta:
Task: "Renomear import em MatchStateManager.ts (T003)"
Task: "Renomear import nos 3 testes de specs/010 (T004)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T011)
5. Neste ponto já existe uma parte do item P1 equivalente do backlog original ("dificuldade
   progressiva") — cadência de spawn crescente, tempo de reação ainda fixo

### Incremental Delivery

1. Setup + Foundational → funções puras de curva prontas, comportamento do jogo inalterado
2. User Story 1 → testar independentemente → cadência de spawn cresce com o tempo
3. User Story 2 → testar independentemente → tempo de reação também diminui com o tempo
4. User Story 3 → testar independentemente → piso mínimo confirmado em partidas extremas
5. Polish → validação de ponta a ponta (incluindo pausa/reinício/pontuação) e regressão da suíte

---

## Notes

- [P] = arquivos diferentes ou sem dependência de tarefa incompleta
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Escrever os testes de cada story primeiro e confirmar que falham antes de implementar (exceto
  T017, uma confirmação de comportamento já garantido por construção)
- Rodar `bun test` após cada tarefa de implementação de domínio (T007, T010, T015)
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
- FR-005 (reinício volta ao ritmo inicial) é satisfeito por construção (`match.startedAt` já é
  redefinido por `start()`/`restart()`) e coberto automaticamente por T012(c), além de validado
  manualmente em T020 (research.md §4)
- FR-006 (pausa não avança a dificuldade) é satisfeito por construção: `survivalMs` vem de
  `elapsedMs(this.match, now)`, e o `now` que chega em `tick()` já é `logicalNow()` (specs/009) —
  não é testável no nível de domínio (pausa é 100% Scene/Phaser, mesmo padrão de `specs/009`, que
  também não tem testes automatizados para isso); validado manualmente em T020 (research.md §4)
- FR-007 (barata em voo não é afetada retroativamente) é satisfeito por construção:
  `Roach.travelDurationMs` é fixado uma única vez em `createRoach` e nunca recalculado
  (`entities/Roach.ts`, inalterado por esta feature) — coberto por T012(b) como regressão, não como
  implementação nova (research.md §5)
- FR-008 (condição de derrota e demais regras do loop principal inalteradas) é satisfeito por
  omissão: nenhuma task desta feature toca `allFoodStolen`, `match.status` ou qualquer regra de
  `specs/001-roach-fridge-clicker` — não há task dedicada porque não há nada a construir, apenas a
  não construir
- FR-009 (pontuação/combo inalterados) é satisfeito por construção: nenhuma task desta feature toca
  `REACTION_BONUS_TIERS`, `COMBO_WINDOW_MS` ou qualquer função de `specs/004-sistema-pontuacao` —
  validado manualmente em T020
