---

description: "Task list template for feature implementation"
---

# Tasks: Variação nos Pontos de Spawn

**Input**: Design documents from `/specs/010-variacao-pontos-spawn/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/spawn-point-selection.md, quickstart.md

**Tests**: incluídas — `plan.md` § Technical Context já decide por `bun test` cobrindo as novas
funções puras de `config/gameConfig.ts` e a orquestração em `systems/MatchStateManager.ts`,
seguindo o mesmo padrão já estabelecido pelo MVP e por `specs/007-tempo-de-sobrevivencia`.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/config/gameConfig.ts`, `client/src/systems/MatchStateManager.ts`,
`client/tests/unit/` (ver `plan.md` → Project Structure). Nenhuma pasta nova é criada;
`client/tests/unit/gameConfig.spawnRegions.test.ts`,
`client/tests/unit/matchStateManager.spawnVariety.test.ts` e
`client/tests/unit/matchStateManager.spawnCoherence.test.ts` são os únicos arquivos novos. Todo o
restante é edição aditiva sobre arquivos já existentes do MVP (`001-roach-fridge-clicker`).

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em arquivos compartilhados
(`config/gameConfig.ts`, `systems/MatchStateManager.ts`).

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova é necessária — `plan.md` §
  Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Introduzir as funções puras de seleção de ponto de spawn (`nearestSpawnRegion`,
`spawnPointCandidates`, `pickSpawnPoint`) e a constante `SPAWN_POINTS_BY_REGION`, sem ainda ligá-las
a `MatchStateManager.tick()` — o jogo continua se comportando exatamente como hoje até o fim desta
fase (`SPAWN_POINTS`/`nearestSpawnPoint` permanecem em uso). Todas as três user stories dependem
deste conjunto de funções.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T002 Escrever testes que falham em `client/tests/unit/gameConfig.spawnRegions.test.ts` (novo
  arquivo) cobrindo, para as 9 posições de comida do grid (`foodItemPosition(shelfIndex,
  slotIndex)` para `shelfIndex`/`slotIndex` em `0..2`):
  (a) paridade com o comportamento de hoje — `nearestSpawnRegion(target)` retorna a região
  esperada por posição, replicando a mesma distância euclidiana às 4 âncoras originais
  (`{GAME_WIDTH/2,-40}`, `{GAME_WIDTH/2,GAME_HEIGHT+40}`, `{-40,GAME_HEIGHT/2}`,
  `{GAME_WIDTH+40,GAME_HEIGHT/2}`) que `nearestSpawnPoint` já usa hoje — regiões esperadas (grid
  3×3, `shelfIndex`=linha/y, `slotIndex`=coluna/x): linha 0 (y=160) → `"top"` nas 3 colunas; linha 1
  (y=320) → `"left"` (coluna 0), `"bottom"` (coluna 1, centro), `"right"` (coluna 2); linha 2
  (y=480) → `"bottom"` nas 3 colunas (research.md §3, contracts/spawn-point-selection.md);
  (b) `spawnPointCandidates(target)` sempre retorna exatamente 3 pontos, todos com `x`/`y` fora do
  intervalo `[0, GAME_WIDTH]`/`[0, GAME_HEIGHT]` (FR-002, data-model.md);
  (c) `pickSpawnPoint(candidates, avoid)` nunca retorna `avoid` quando `candidates.length > 1` e
  `avoid` pertence a `candidates`, e retorna o único candidato quando `candidates.length === 1`
  independentemente de `avoid` (contracts/spawn-point-selection.md)
- [X] T003 Implementar o tipo `SpawnRegion` e a constante `SPAWN_POINTS_BY_REGION` em
  `client/src/config/gameConfig.ts` — 4 regiões (`"top" | "bottom" | "left" | "right"`), 3 pontos
  cada, como frações de `GAME_WIDTH`/`GAME_HEIGHT` com a mesma margem de 40px fora da tela já usada
  hoje (25%/50%/75% ao longo do eixo variável da borda; o ponto de 50% coincide com o ponto único
  atual daquele lado) (data-model.md § "SPAWN_POINTS_BY_REGION", research.md §1–2) (depende de
  T002)
- [X] T004 Implementar `nearestSpawnRegion(target: Point): SpawnRegion` em
  `client/src/config/gameConfig.ts`, reaproveitando a mesma varredura de distância euclidiana ao
  quadrado que `nearestSpawnPoint` já faz hoje, mas contra as 4 âncoras originais e retornando o
  nome da região em vez do `Point` (research.md §3, contracts/spawn-point-selection.md) (depende de
  T003)
- [X] T005 Implementar `spawnPointCandidates(target: Point): readonly Point[]` em
  `client/src/config/gameConfig.ts` como `SPAWN_POINTS_BY_REGION[nearestSpawnRegion(target)]`
  (depende de T004)
- [X] T006 Implementar `pickSpawnPoint(candidates: readonly Point[], avoid?: Point): Point` em
  `client/src/config/gameConfig.ts`: se `avoid` for `undefined`, ou `candidates.length <= 1`, ou
  `avoid` não pertencer a `candidates`, sorteia uniformemente (`Math.random()`) entre todos os itens
  de `candidates`; caso contrário, sorteia uniformemente entre `candidates` excluindo `avoid`
  (contracts/spawn-point-selection.md) (depende de T003)
- [X] T007 Rodar `bun test` em `client/` e confirmar que os testes de T002 passam e que não há
  regressões na suíte existente (depende de T004, T005, T006)

**Checkpoint**: `nearestSpawnRegion`/`spawnPointCandidates`/`pickSpawnPoint` prontas e testadas;
`SPAWN_POINTS`/`nearestSpawnPoint` continuam sendo o que `MatchStateManager` de fato usa — nenhuma
mudança de comportamento visível ao jogador ainda. User Story 1 pode começar.

---

## Phase 3: User Story 1 - Entradas menos previsíveis ao longo de uma partida (Priority: P1) 🎯 MVP

**Goal**: Fazer as baratas surgirem de mais de 4 pontos possíveis, variando qual ponto da região
coerente é usado a cada spawn (FR-001, FR-004).

**Independent Test**: jogar uma partida observando várias levas de spawn consecutivas e confirmar
que as baratas aparecem em pontos diferentes ao longo das bordas da tela (não sempre nos mesmos 4
pontos fixos de hoje), permanecendo todas fora da área das prateleiras/comidas.

### Tests for User Story 1

> **NOTE: escrever estes testes primeiro e confirmar que falham antes de implementar**

- [X] T008 [US1] Escrever teste que falha em
  `client/tests/unit/matchStateManager.spawnVariety.test.ts` (novo arquivo): isolar um único alvo
  controlável — deixar as 8 comidas restantes serem roubadas (avançar `tick()` até cada uma
  alcançar `spawnedAt + travelDurationMs` sem chamar `tryEliminateRoach`) até restar exatamente 1
  comida presente; a partir daí, repetir ~30+ ciclos de spawn chamando
  `tryEliminateRoach(roach.id, roach.spawnedAt)` logo após cada spawn (isso libera a comida como
  candidata de novo no próximo `tick()`, sem nunca deixá-la ser roubada) e coletar os `spawnPoint`
  observados; confirmar que mais de 1 ponto distinto aparece para aquele alvo — hoje
  (`nearestSpawnPoint`) seria sempre exatamente o mesmo ponto (FR-001, FR-004, spec.md US1
  AC1/AC2)
- [X] T009 [US1] Escrever teste que falha em
  `client/tests/unit/matchStateManager.spawnVariety.test.ts` (mesmo arquivo de T008): criar um
  `MatchStateManager`, chamar `start(0)`, escutar o evento `"roach:spawned"` para coletar o
  `spawnPoint` de cada barata em um `Set<string>` (chave `` `${x},${y}` ``) e, a cada spawn, chamar
  `tryEliminateRoach(roach.id, roach.spawnedAt)` imediatamente (simulando um jogador que nunca
  deixa uma comida ser roubada, mantendo as 9 comidas sempre presentes e candidatas); avançar
  `tick()` em passos de `SPAWN_INTERVAL_MS` por ~120000ms simulados (≈48 spawns); confirmar que o
  `Set` final tem pelo menos 8 posições distintas, contra as 4 de hoje (SC-001) (depende de T008 —
  mesmo arquivo)

### Implementation for User Story 1

- [X] T010 [US1] Em `tick()` de `client/src/systems/MatchStateManager.ts`, substituir a chamada
  `nearestSpawnPoint(targetPosition)` por `pickSpawnPoint(spawnPointCandidates(targetPosition))`
  (ainda sem o parâmetro `avoid` — isso é da User Story 3) e atualizar o import de `gameConfig`
  (remove `nearestSpawnPoint`, adiciona `spawnPointCandidates`/`pickSpawnPoint`) — faz T008 e T009
  passarem (depende de T008, T009, T005, T006)
- [X] T011 Em `client/src/config/gameConfig.ts`, remover a constante `SPAWN_POINTS` e a função
  `nearestSpawnPoint`, agora sem nenhum chamador (Princípio IV — nenhum código morto) (depende de
  T010)
- [X] T012 Rodar `bun test` em `client/` e confirmar que T008 e T009 passam e que não há
  regressões (depende de T010, T011)
- [~] T013 [US1] Validar manualmente o cenário 1 do
  `specs/010-variacao-pontos-spawn/quickstart.md` (observar spawns variando ao longo das bordas,
  sempre fora da área das prateleiras) rodando `bun run dev` em `client/`

**Checkpoint**: User Story 1 completa e testável de forma independente — variedade de pontos de
spawn já existe, incluindo o critério agregado de SC-001.

---

## Phase 4: User Story 2 - Trajeto continua coerente com o alvo (Priority: P2)

**Goal**: Confirmar explicitamente, com um teste dedicado de integração, que a variedade introduzida
pela User Story 1 nunca faz uma barata surgir do lado oposto ao seu alvo (FR-002, FR-003).

**Independent Test**: para comidas em posições diferentes do grid, confirmar que os pontos de spawn
observados estão sempre na borda geometricamente mais próxima/coerente com aquele alvo, nunca na
borda oposta.

### Tests for User Story 2

- [X] T014 [P] [US2] Escrever teste de confirmação (não é TDD "que falha" — a coerência já é
  garantida por construção desde T004/T005/T010) em novo arquivo
  `client/tests/unit/matchStateManager.spawnCoherence.test.ts`: rodar um `MatchStateManager` por
  muitos ticks e, para cada barata spawnada, confirmar que seu `spawnPoint` pertence exatamente a
  `spawnPointCandidates(foodItemPosition(...))` calculado para o próprio alvo daquela barata — ou
  seja, nenhuma barata jamais nasce em um ponto da região oposta à do seu alvo (spec.md US2 AC1/AC2,
  FR-003)

### Implementation for User Story 2

- [X] T015 [US2] Rodar T014 e confirmar que passa sem nenhuma mudança de código adicional — a
  coerência já é garantida por `nearestSpawnRegion`/`spawnPointCandidates` (T004/T005) e pelo uso
  delas em `tick()` (T010); caso falhe, ajustar `MatchStateManager.tick()` conforme
  contracts/spawn-point-selection.md (depende de T014, T010)
- [~] T016 [US2] Validar manualmente o cenário 2 do
  `specs/010-variacao-pontos-spawn/quickstart.md` (lado de entrada permanece coerente com o lado do
  alvo) rodando `bun run dev`

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente e em conjunto — variedade com
coerência garantida.

---

## Phase 5: User Story 3 - Sem repetição consecutiva óbvia (Priority: P3)

**Goal**: Evitar que dois spawns consecutivos para o mesmo alvo usem exatamente o mesmo ponto,
quando há alternativa na região (FR-005).

**Independent Test**: forçar duas baratas seguidas com o mesmo alvo e confirmar que os pontos de
spawn escolhidos não são idênticos, desde que existam pontos alternativos na mesma região.

### Tests for User Story 3

- [X] T017 [US3] Escrever testes que falham em
  `client/tests/unit/matchStateManager.spawnVariety.test.ts` (arquivo criado em T008): (a)
  reaproveitando a mesma técnica de isolamento de alvo único de T008 (deixar as demais comidas
  serem roubadas até restar 1, depois chamar `tryEliminateRoach` repetidamente para reabrir o
  mesmo slot), confirmar que, quando a região coerente daquele alvo tem mais de 1 candidato, o
  ponto do spawn nunca é idêntico ao do spawn imediatamente anterior para aquele mesmo alvo,
  repetindo a checagem por várias rodadas para descartar coincidência (FR-005, spec.md US3 AC1);
  (b) confirmar que, após `restart(now)`, o próximo spawn de um alvo que já havia spawnado antes
  do restart não é restringido pelo ponto usado antes do restart (a regra de não-repetição some
  junto com o reset da partida — spec.md Edge Cases) (depende de T008 — mesmo arquivo)

### Implementation for User Story 3

- [X] T018 [US3] Adicionar o campo privado `lastSpawnPointByTarget: Map<string, Point>` a
  `MatchStateManager` (`client/src/systems/MatchStateManager.ts`), inicializado vazio; limpá-lo
  (`= new Map()`) dentro de `start()` (chamado também por `restart()`) (data-model.md § "Estado
  novo em MatchStateManager") (depende de T017)
- [X] T019 [US3] Em `tick()` de `client/src/systems/MatchStateManager.ts`: antes de chamar
  `pickSpawnPoint`, ler `const avoid = this.lastSpawnPointByTarget.get(target.id)`; passar `avoid`
  como segundo argumento de `pickSpawnPoint(candidates, avoid)`; após escolher `spawnPoint`, chamar
  `this.lastSpawnPointByTarget.set(target.id, spawnPoint)` (contracts/spawn-point-selection.md §
  "Chamador") — faz T017 passar (depende de T018, T010)
- [X] T020 Rodar `bun test` em `client/` e confirmar que T017 passa e que não há regressões
  (depende de T019)
- [~] T021 [US3] Validar manualmente o cenário 3 do
  `specs/010-variacao-pontos-spawn/quickstart.md` (spawns consecutivos para o mesmo alvo não
  repetem o mesmo pixel de origem) rodando `bun run dev`

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto — variedade,
coerência e não-repetição consecutiva.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta.

- [~] T022 Rodar a validação manual completa de
  `specs/010-variacao-pontos-spawn/quickstart.md` (cenários 1–4, incluindo a checagem de
  desempenho SC-003) em `client/` via `bun run dev`
- [X] T023 [P] Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte existente
  (MVP + specs anteriores) além dos novos testes desta feature
  (`gameConfig.spawnRegions.test.ts`, `matchStateManager.spawnVariety.test.ts`,
  `matchStateManager.spawnCoherence.test.ts`)
- [~] T024 Verificar o critério de performance (plan.md § Performance Goals) com o painel de
  performance do navegador aberto durante uma partida com spawns frequentes: confirmar 60 FPS
  estável e nenhum atraso perceptível entre clique e remoção da barata

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup — BLOQUEIA todas as user stories
- **User Story 1 (Phase 3)**: depende de Foundational (T004, T005, T006) — é o MVP
- **User Story 2 (Phase 4)**: depende de Foundational e de `tick()` já usar
  `spawnPointCandidates`/`pickSpawnPoint` (T010 da US1), pois valida esse mesmo código sob um
  ângulo diferente (coerência de região)
- **User Story 3 (Phase 5)**: depende de Foundational e de `tick()` já usar `pickSpawnPoint` (T010
  da US1), já que estende a mesma chamada com o parâmetro `avoid`
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Foundational — nenhuma dependência de outra story
- **User Story 2 (P2)**: depende de Foundational e reaproveita a mesma orquestração de `tick()`
  criada pela US1 (não é estritamente independente no código, mas é independentemente
  **testável**: dá para validar US1 sozinha antes de existir um teste dedicado de coerência)
- **User Story 3 (P3)**: depende de Foundational e da mesma chamada `pickSpawnPoint` em `tick()`
  criada pela US1, mas é independentemente **testável**: dá para validar US1+US2 sem nenhuma regra
  de não-repetição antes desta fase existir

### Within Each User Story

- Testes escritos e falhando antes da implementação (T008/T009→T010, T014→T015 (confirmação),
  T017→T018/T019)
- Funções puras de domínio (`config/gameConfig.ts`, Foundational) antes da orquestração em
  `MatchStateManager` (T004–T006 → T010)
- Story completa (incluindo validação manual) antes de avançar para a próxima prioridade

### Parallel Opportunities

- T008 e T009 tocam o mesmo arquivo novo (`matchStateManager.spawnVariety.test.ts`) e são
  sequenciais entre si (T009 depende de T008) — nenhuma das duas é marcada `[P]`
- T014 é o único teste da User Story 2, em arquivo próprio — marcado `[P]` por não conflitar com
  nenhuma tarefa de implementação em andamento (a implementação já existe desde a US1)
- T023 (suíte automatizada) pode rodar em paralelo com a validação manual T022/T024

---

## Parallel Example

Esta feature concentra a maior parte das edições em dois arquivos compartilhados
(`config/gameConfig.ts`, `systems/MatchStateManager.ts`) e em um único arquivo de teste por story
relacionada — por isso há pouquíssimo paralelismo real dentro de cada user story. A única
oportunidade genuína de execução em paralelo é no Polish, entre a suíte automatizada e a validação
manual:

```bash
# Podem rodar ao mesmo tempo (Phase 6):
Task: "Rodar bun test completo em client/ (T023)"
Task: "Validar manualmente specs/010-variacao-pontos-spawn/quickstart.md (T022) e o painel de performance (T024)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T013)
5. Neste ponto já existe o item P2 equivalente do backlog original ("variação nos pontos de
   spawn"), agora coberto por esta spec dedicada

### Incremental Delivery

1. Setup + Foundational → funções puras de seleção prontas, comportamento do jogo inalterado
2. User Story 1 → testar independentemente → variedade de pontos de spawn visível
3. User Story 2 → testar independentemente → coerência de lado confirmada por teste dedicado
4. User Story 3 → testar independentemente → sem repetição consecutiva óbvia
5. Polish → validação de ponta a ponta e regressão da suíte de testes

---

## Notes

- [P] = arquivos diferentes ou sem dependência de tarefa incompleta
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Escrever os testes de cada story primeiro e confirmar que falham antes de implementar (exceto
  T014, uma confirmação de comportamento já garantido por construção)
- Rodar `bun test` após cada tarefa de implementação de domínio (T007, T012, T020)
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
- FR-006 (duração de viagem/cadência inalteradas) é satisfeito por construção: nenhuma task desta
  feature toca `TRAVEL_DURATION_MS`, `SPAWN_INTERVAL_MS` ou `entities/Roach.ts` — não há task
  dedicada a FR-006 porque não há nada a construir, apenas a não construir
- FR-007 (sem custo perceptível de desempenho) é satisfeito por construção: `nearestSpawnRegion`/
  `pickSpawnPoint` operam sobre arrays de tamanho fixo (≤4 regiões, 3 pontos cada) — validado
  manualmente em T024
- SC-004 (percepção qualitativa do jogador) não tem task dedicada — é um critério informal, sem
  infraestrutura de teste com usuários no projeto, consistente com o restante do backlog
