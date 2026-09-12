---
description: "Task list template for feature implementation"
---

# Tasks: Loop Principal — Baratas na Geladeira

**Input**: Design documents from `/specs/001-roach-fridge-clicker/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/domain-api.md, quickstart.md

**Tests**: Incluídas — a constitution (Princípio I) exige que a lógica de domínio seja
exercitável isoladamente sem o Phaser renderizar nada; os testes unitários abaixo (`bun test`,
research.md §1) são a forma de verificar isso, não testes de endpoint/contrato externo (o projeto
não tem API externa).

**Organization**: Tarefas agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos estão incluídos nas descrições

## Path Conventions

Projeto único (client-only game), sem separação frontend/backend — Princípio VII da
constitution. Todos os caminhos são relativos a `client/` (único workspace do repositório):
`client/src/`, `client/tests/`, `client/public/assets/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicialização do bundler e da infraestrutura de testes/assets, ainda ausentes no
scaffold atual.

- [X] T001 Criar `client/vite.config.ts` (config mínima do Vite para servir `index.ts` como
  bootstrap do Phaser) e adicionar os scripts `"dev": "vite"` e `"build": "vite build"` a
  `client/package.json`
- [X] T002 [P] Adicionar o script `"test": "bun test"` a `client/package.json` e criar o
  diretório `client/tests/unit/`
- [X] T003 [P] Criar a estrutura `client/public/assets/{sprites,audio,fonts}` (constitution
  Princípio VI — assets organizados desde o início, mesmo com arte placeholder)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: entidades de domínio e infraestrutura Phaser compartilhadas por todas as user
stories.

**⚠️ CRITICAL**: nenhuma user story pode começar antes desta fase estar completa.

- [X] T004 [P] Criar `client/src/config/gameConfig.ts` com as constantes fixas de research.md:
  `SHELF_COUNT = 3`, `FOOD_ITEMS_PER_SHELF = 3` (9 comidas no total), `SPAWN_INTERVAL_MS = 2500`,
  `TRAVEL_DURATION_MS = 3000`, `HITBOX_PADDING_PX = 6`, e os 4 pontos fixos de spawn nas bordas da
  cena (research.md §2–§5); estas constantes DEVEM ser o único ponto de leitura desses valores em
  todo o código (FR-016 — nenhuma outra parte do sistema pode redefinir ou variar esses números
  durante a partida)
- [X] T005 [P] Criar a entidade `FoodItem` em `client/src/entities/FoodItem.ts` — TypeScript
  puro, sem import de `phaser`; campos `id: string`, `shelfId: string`, `slotIndex: number`,
  `state: 'present' | 'stolen'`; transição permitida apenas `present → stolen`, nunca o inverso
  na mesma partida (data-model.md §FoodItem, FR-008)
- [X] T006 [P] Criar a entidade `Shelf` em `client/src/entities/Shelf.ts` — TypeScript puro;
  campos `id: string`, `foodItemIds: string[]` (data-model.md §Shelf)
- [X] T007 [P] Criar a entidade `Roach` em `client/src/entities/Roach.ts` — TypeScript puro;
  campos `id`, `targetFoodItemId` (fixo desde o spawn, nunca reatribuído — FR-004),
  `spawnPoint: { x: number; y: number }`, `spawnedAt: number`, `travelDurationMs: number`,
  `state: 'active' | 'eliminated' | 'reachedTarget'`; em caso de empate entre clique e chegada no
  mesmo tick, `'eliminated'` tem prioridade sobre `'reachedTarget'` (data-model.md §Roach, FR-017)
- [X] T008 Criar a entidade `Match` em `client/src/entities/Match.ts` — TypeScript puro; campos
  `shelves: Shelf[]`, `foodItems: FoodItem[]`, `activeRoaches: Roach[]`,
  `status: 'notStarted' | 'playing' | 'lost'`; nunca mais de uma `Roach` ativa mirando a mesma
  `FoodItem` (FR-009); `status` só vai para `'lost'` quando todas as `FoodItem` tiverem
  `state === 'stolen'` (FR-010) (depende de T005, T006, T007)
- [X] T009 Criar o esqueleto de `MatchStateManager` em `client/src/systems/MatchStateManager.ts`
  — dono de uma instância de `Match`; implementar `getSnapshot(): MatchSnapshot` (cópia
  somente-leitura de `shelves`/`foodItems`/`activeRoaches`/`status`) e um pub-sub simples baseado
  em `EventTarget` nativo (nunca `Phaser.Events`) para os eventos `match:started`,
  `roach:spawned`, `roach:eliminated`, `food:stolen`, `match:lost` (contracts/domain-api.md
  §MatchStateManager) (depende de T008)
- [X] T010 [P] Criar o esqueleto de `CollisionSystem` em `client/src/systems/CollisionSystem.ts`
  com as assinaturas `hitTestRoach(pointerX, pointerY, roach, roachVisualRadius): boolean` e
  `pickTopmostHit(pointerX, pointerY, roaches, ...): Roach | undefined`, sem lógica ainda
  (contracts/domain-api.md §CollisionSystem)
- [X] T011 [P] Criar `client/src/scenes/BootScene.ts` (carrega assets placeholder de
  `client/public/assets/sprites` e transiciona para a próxima scene) e atualizar `client/index.ts`
  para inicializar `new Phaser.Game(...)` registrando as scenes (depende de T003)

**Checkpoint**: fundação pronta — a implementação das user stories pode começar.

---

## Phase 3: User Story 1 - Eliminar baratas antes que roubem comida (Priority: P1) 🎯 MVP

**Goal**: baratas surgem, se movem em direção a uma comida-alvo fixa, e o jogador pode clicar
para eliminá-las antes que roubem a comida; se não clicar a tempo, a comida é roubada
permanentemente.

**Independent Test**: com uma partida em andamento (comidas nas prateleiras, pelo menos uma
barata em tela), clicar em uma barata antes dela alcançar seu alvo e confirmar que ela some
imediatamente e a comida-alvo permanece intacta; deixar uma segunda barata alcançar seu alvo sem
clicar e confirmar que a comida correspondente desaparece e não pode ser recuperada.

### Tests for User Story 1 ⚠️

> **NOTE: escrever estes testes primeiro e confirmar que falham antes da implementação**

- [X] T012 [P] [US1] Teste unitário: uma `Roach` recém-criada é associada a uma `FoodItem`
  ainda `'present'` e o alvo nunca muda depois do spawn (FR-004, FR-009) em
  `client/tests/unit/roach.spawn.test.ts`
- [X] T013 [P] [US1] Teste unitário: `MatchStateManager.tick()` spawna uma nova `Roach` a cada
  `SPAWN_INTERVAL_MS` (2500ms) e nunca cria uma barata para uma `FoodItem` que já esteja
  `'stolen'` ou já tenha uma barata ativa (FR-003, FR-009, FR-021) em
  `client/tests/unit/matchStateManager.spawn.test.ts`
- [X] T014 [P] [US1] Teste unitário: quando `travelDurationMs` (3000ms) se esgota sem
  eliminação, a `FoodItem` alvo transiciona para `'stolen'` e a `Roach` é removida de
  `activeRoaches`, sem afetar nenhuma outra comida (FR-007, FR-008, SC-003) em
  `client/tests/unit/matchStateManager.steal.test.ts`
- [X] T015 [P] [US1] Teste unitário: `tryEliminateRoach()` remove a barata quando o clique
  ocorre antes da chegada, não tem efeito em barata já `'eliminated'`/`'reachedTarget'`, e em caso
  de empate exato entre clique e chegada favorece o clique (FR-006, FR-017) em
  `client/tests/unit/matchStateManager.eliminate.test.ts`
- [X] T016 [P] [US1] Teste unitário: `hitTestRoach` aceita cliques dentro do raio do sprite +
  6px de padding (`HITBOX_PADDING_PX`) e `pickTopmostHit` retorna no máximo uma barata quando
  duas ou mais estão sobrepostas (FR-018, research.md §4) em
  `client/tests/unit/collisionSystem.test.ts`
- [X] T017 [P] [US1] Teste unitário: `SPAWN_INTERVAL_MS` e `TRAVEL_DURATION_MS` (lidos de
  `gameConfig.ts`) permanecem idênticos entre o primeiro e o último spawn de uma partida
  simulada de várias rodadas de `tick()`, confirmando que nenhuma lógica de dificuldade
  progressiva altera esses valores em tempo de execução (FR-016) em
  `client/tests/unit/matchStateManager.constants.test.ts`

### Implementation for User Story 1

- [X] T018 [US1] Implementar a lógica de spawn em `MatchStateManager.tick()`: a cada
  `SPAWN_INTERVAL_MS`, sortear uma `FoodItem` com `state === 'present'` e sem `Roach` ativa
  mirando-a, criar a `Roach` no ponto de entrada fixo mais direto até a prateleira dessa comida, e
  emitir `roach:spawned` (FR-003, FR-004, FR-005, FR-009, FR-021) em
  `client/src/systems/MatchStateManager.ts`
- [X] T019 [US1] Implementar o roubo de comida em `MatchStateManager.tick()`: quando o tempo de
  viagem de uma `Roach` ativa se esgota, transicionar a `FoodItem` alvo para `'stolen'`, remover a
  `Roach` de `activeRoaches` e emitir `food:stolen` (FR-007, FR-008) em
  `client/src/systems/MatchStateManager.ts` (depende de T018)
- [X] T020 [US1] Implementar `tryEliminateRoach(roachId, clientTimestamp)` com o desempate
  favorecendo o clique (FR-006, FR-015, FR-017) e emitir `roach:eliminated` em
  `client/src/systems/MatchStateManager.ts` (depende de T018)
- [X] T021 [P] [US1] Implementar `hitTestRoach` (círculo de raio `roachVisualRadius +
  HITBOX_PADDING_PX`) e `pickTopmostHit` (apenas a barata mais "acima" na pilha visual) em
  `client/src/systems/CollisionSystem.ts` (FR-018)
- [X] T022 [US1] Implementar `client/src/scenes/GameScene.ts`: a cada frame chamar
  `MatchStateManager.tick(scene.time.now)`, renderizar `getSnapshot()` (prateleiras, comidas,
  baratas com posição interpolada entre `spawnPoint` e o alvo), tratar `pointerdown` via
  `hitTestRoach`/`pickTopmostHit` + `tryEliminateRoach`, e exibir feedback visual breve de queda
  ao eliminar e de sumiço ao roubar (FR-006, FR-015, FR-020) (depende de T018, T019, T020, T021)
- [X] T023 [US1] Adicionar sprites placeholder de barata, comida e prateleira/geladeira em
  `client/public/assets/sprites/` seguindo a estrutura da constitution Princípio VI

**Checkpoint**: o loop central (spawn → movimento → clique/roubo) é jogável de forma
independente (partida pode ser iniciada diretamente por `MatchStateManager.start()` para teste
manual, mesmo sem tela inicial/final).

---

## Phase 4: User Story 2 - Perder a partida quando todas as comidas somem (Priority: P2)

**Goal**: a partida entra em derrota exatamente quando a última comida é roubada, exibindo uma
tela final que permite reiniciar sem recarregar a página.

**Independent Test**: iniciar uma partida com um conjunto pequeno de comidas, deixar que todas
sejam roubadas por baratas não eliminadas, e confirmar que a tela de derrota aparece assim que a
última comida some, oferecendo a opção de reiniciar.

### Tests for User Story 2 ⚠️

- [X] T024 [P] [US2] Teste unitário: `Match.status` transiciona para `'lost'` exatamente quando
  a última `FoodItem` se torna `'stolen'`, e nenhuma nova `Roach` é adicionada a
  `activeRoaches` depois disso (FR-010, FR-014, SC-004) em
  `client/tests/unit/match.loss.test.ts`
- [X] T025 [P] [US2] Teste unitário: `MatchStateManager.restart()` recria todas as `FoodItem`
  com `state: 'present'` e esvazia `activeRoaches`, mesmo chamado repetidamente em sequência
  rápida (FR-013, Edge Case de reinício) em `client/tests/unit/matchStateManager.restart.test.ts`

### Implementation for User Story 2

- [X] T026 [US2] Implementar a detecção de derrota: em `Match` (`client/src/entities/Match.ts`),
  expor a verificação de "todas as comidas roubadas"; em `MatchStateManager.tick()`
  (`client/src/systems/MatchStateManager.ts`), setar `status = 'lost'`, parar de spawnar novas
  baratas e emitir `match:lost` assim que a condição for satisfeita (FR-010, FR-014) (depende de
  T019)
- [X] T027 [US2] Implementar `MatchStateManager.restart()` per contracts/domain-api.md (FR-013)
  em `client/src/systems/MatchStateManager.ts` (depende de T009)
- [X] T028 [US2] Criar `client/src/scenes/GameOverScene.ts`: escutar `match:lost`, exibir a
  mensagem de derrota (ex.: "Todas as comidas foram roubadas! Você perdeu.", FR-011) e um botão
  de reiniciar que chama `restart()` e retorna à `GameScene` em menos de 2 segundos, sem
  recarregar a página (FR-011, FR-012, SC-005) (depende de T027)
- [X] T029 [US2] Conectar `GameScene` → `GameOverScene` na transição de cena ao evento
  `match:lost` em `client/src/scenes/GameScene.ts` (depende de T026, T028)

**Checkpoint**: o ciclo completo de uma partida (jogar → perder → reiniciar) funciona de ponta a
ponta.

---

## Phase 5: User Story 3 - Começar uma partida a partir da tela inicial (Priority: P3)

**Goal**: o jogo abre em uma tela inicial, sem nenhuma comida/prateleira/barata visível, e o
jogador inicia a partida com uma única ação.

**Independent Test**: abrir o jogo, confirmar que a tela inicial aparece antes de qualquer
comida ou barata em tela, acionar a opção de começar e confirmar que a partida passa a exibir as
prateleiras com comidas e o spawn de baratas se inicia.

### Tests for User Story 3 ⚠️

- [X] T030 [P] [US3] Teste unitário: `MatchStateManager.start()` cria uma nova `Match` com
  `status: 'playing'`, 3 prateleiras com 9 comidas totais em `state: 'present'`, e
  `activeRoaches` vazio (FR-002) em `client/tests/unit/matchStateManager.start.test.ts`

### Implementation for User Story 3

- [X] T031 [US3] Implementar `MatchStateManager.start()` per contracts/domain-api.md (FR-001,
  FR-002) em `client/src/systems/MatchStateManager.ts` (depende de T009)
- [X] T032 [US3] Criar `client/src/scenes/StartScene.ts`: tela inicial com opção "Iniciar",
  sem nenhuma comida/prateleira/barata visível antes do clique; ao acionar, chamar `start()` e
  transicionar para `GameScene` ao receber `match:started` (FR-001, User Story 3 acceptance
  scenarios) (depende de T031)
- [X] T033 [US3] Atualizar `client/index.ts` para que o bootstrap do Phaser inicie sempre em
  `StartScene` (via `BootScene`) (depende de T011, T032)

**Checkpoint**: as três user stories funcionam integradas — tela inicial → partida → derrota →
reinício, sem recarregar a página.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: validação final e conformidade com a constitution.

- [X] T034 [P] Executar os cenários de validação manual de `specs/001-roach-fridge-clicker/quickstart.md`
  em Chrome, Firefox e Edge desktop, incluindo a medição de tempo de reinício (SC-005)
- [X] T035 [P] Verificar 60 FPS estável (mínimo aceitável: 55 FPS) e ausência de lag perceptível
  de clique (SC-002, SC-006) usando o profiler de performance do navegador durante uma partida
  completa
- [X] T036 Auditar `client/src/entities/` e `client/src/systems/` para garantir que: (a) nenhum
  import de `phaser` foi introduzido (constitution Princípio I); (b) nenhum estado de partida
  ficou espalhado em `client/src/scenes/` (Princípio II); (c) nenhum mecanismo de pontuação —
  variável, evento ou UI — foi introduzido em qualquer camada (FR-019); (d) nenhum HUD ou
  contador numérico de comidas restantes/roubadas foi adicionado a `GameScene` ou a `client/src/ui/`
  (FR-022)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende da conclusão do Setup — BLOQUEIA todas as user stories
- **User Stories (Phase 3+)**: todas dependem da conclusão da fase Foundational
  - Podem prosseguir em paralelo (se houver mais de um desenvolvedor) ou sequencialmente em
    ordem de prioridade (P1 → P2 → P3)
- **Polish (Fase final)**: depende de todas as user stories desejadas estarem completas

### User Story Dependencies

- **User Story 1 (P1)**: pode começar após a Fase 2 — sem dependência de outras stories
- **User Story 2 (P2)**: pode começar após a Fase 2; reutiliza `MatchStateManager.tick()` de
  US1 (T019) para detectar derrota — logicamente depende da implementação de roubo de comida de
  US1 estar concluída (dependência já documentada, não é um problema de independência: a story
  continua testável de forma isolada uma vez implementada)
- **User Story 3 (P3)**: pode começar após a Fase 2; `StartScene` depende apenas de
  `MatchStateManager.start()` (T031), não de US1/US2, mas só é validável ponta a ponta depois de
  ambas existirem

### Within Each User Story

- Testes (T012–T017, T024–T025, T030) devem ser escritos e falhar antes da implementação
  correspondente
- Entidades antes de sistemas; sistemas antes de scenes
- Story completa antes de avançar para a próxima prioridade, na estratégia sequencial

### Parallel Opportunities

- Todas as tasks [P] da Fase 1 (T002, T003) podem rodar em paralelo
- Na Fase 2: T004–T007 e T010, T011 são arquivos independentes e podem rodar em paralelo; T008
  depende de T005–T007; T009 depende de T008
- Todos os testes [P] de uma mesma user story podem rodar em paralelo entre si
- Depois da Fase 2, US1/US2/US3 podem ser trabalhadas em paralelo por desenvolvedores diferentes
  (respeitando a dependência lógica de US2 em relação a T019 de US1)

---

## Parallel Example: User Story 1

```bash
# Testes de US1 em paralelo:
Task: "Teste unitário de spawn de Roach em client/tests/unit/roach.spawn.test.ts"
Task: "Teste unitário de spawn periódico em client/tests/unit/matchStateManager.spawn.test.ts"
Task: "Teste unitário de roubo de comida em client/tests/unit/matchStateManager.steal.test.ts"
Task: "Teste unitário de eliminação em client/tests/unit/matchStateManager.eliminate.test.ts"
Task: "Teste unitário de hit-testing em client/tests/unit/collisionSystem.test.ts"
Task: "Teste unitário de constância de spawn/velocidade em client/tests/unit/matchStateManager.constants.test.ts"

# Implementação independente de CollisionSystem em paralelo com a lógica de MatchStateManager:
Task: "Implementar hitTestRoach/pickTopmostHit em client/src/systems/CollisionSystem.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 apenas)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (CRÍTICO — bloqueia todas as stories)
3. Completar Fase 3: User Story 1
4. **PARAR e VALIDAR**: testar User Story 1 de forma independente (via `MatchStateManager.start()`
   chamado diretamente, sem tela inicial)
5. Demonstrar se estiver pronto

### Incremental Delivery

1. Completar Setup + Foundational → fundação pronta
2. Adicionar User Story 1 → testar independentemente → demo (MVP do loop de clique!)
3. Adicionar User Story 2 → testar independentemente → demo (ciclo completo de derrota/reinício)
4. Adicionar User Story 3 → testar independentemente → demo (experiência completa desde a tela
   inicial)
5. Cada story agrega valor sem quebrar as anteriores

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências pendentes
- O rótulo [Story] mapeia a task à user story correspondente para rastreabilidade
- Verificar que os testes falham antes de implementar
- Fazer commit após cada task ou grupo lógico de tasks
- Parar em qualquer checkpoint para validar a story de forma independente
- Evitar: tasks vagas, conflitos de mesmo arquivo entre tasks [P], dependências entre stories que
  quebrem a independência
