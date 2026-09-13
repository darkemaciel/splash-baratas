---

description: "Task list template for feature implementation"
---

# Tasks: HUD de Progresso/Risco

**Input**: Design documents from `/specs/002-hud-progresso-risco/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/domain-api-hud.md, quickstart.md

**Tests**: incluídas — `research.md` §5 e o campo `Testing` de `plan.md` já decidem por `bun test`
cobrindo as novas funções puras de domínio (`foodRemainingCount`, `foodTotalCount`, `riskLevel`),
seguindo o padrão de testes unitários já estabelecido pelo MVP (`client/tests/unit/`).

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/`, `client/tests/unit/` (ver `plan.md` → Project Structure). Nenhuma
pasta nova é criada; todos os arquivos abaixo já existem no MVP (`001-roach-fridge-clicker`),
exceto `client/tests/unit/match.hud.test.ts`, que é novo.

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em arquivos compartilhados pelo
MVP (`entities/Match.ts`, `systems/MatchStateManager.ts`, `scenes/GameScene.ts`).

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova ou configuração é necessária —
  `plan.md` § Technical Context confirma que não há nova stack/dependência)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura de leitura (`foodRemainingCount`, `foodTotalCount` em
`MatchSnapshot`) usada pela User Story 1 e, indiretamente, por todas as demais.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T002 Escrever testes que falham para `foodRemainingCount(match)` e `foodTotalCount(match)`
  em `client/tests/unit/match.hud.test.ts` (novo arquivo), cobrindo: partida recém-criada (9/9),
  uma comida roubada (8/9), todas roubadas (0/9) — thresholds de `data-model.md` § "Valores
  derivados expostos via MatchSnapshot"
- [X] T003 Implementar `foodRemainingCount(match)` (conta `foodItems` com `state === 'present'`) e
  `foodTotalCount(match)` (retorna `match.foodItems.length`) em
  `client/src/entities/Match.ts`, ao lado das demais funções puras existentes (`allFoodStolen`
  etc.) — faz T002 passar (depende de T002)
- [X] T004 Estender a interface `MatchSnapshot` em
  `client/src/systems/MatchStateManager.ts` com `readonly foodRemainingCount: number` e
  `readonly foodTotalCount: number`, calculados dentro de `getSnapshot()` chamando as funções de
  T003 (depende de T003)

**Checkpoint**: `MatchSnapshot` já expõe a contagem de comidas restantes/total — User Story 1 pode
começar.

---

## Phase 3: User Story 1 - Acompanhar o risco da partida sem examinar as prateleiras (Priority: P1) 🎯 MVP

**Goal**: Exibir, durante toda a partida, um contador numérico de comidas restantes que atualiza
imediatamente ao roubo de comida e permanece inalterado quando uma barata é apenas eliminada
(FR-001 parcial — número; FR-002, FR-003, FR-004).

**Independent Test**: iniciar uma partida e confirmar que o HUD mostra "9" (ou "9/9"); deixar uma
barata roubar uma comida e confirmar que o número cai para 8 no mesmo momento; eliminar uma barata
antes que alcance o alvo e confirmar que o número não muda.

### Implementation for User Story 1

- [X] T005 [US1] Em `create()` de `client/src/scenes/GameScene.ts`, criar um
  `Phaser.GameObjects.Text` para o HUD, posicionado no topo-centro da cena (`x = GAME_WIDTH / 2`,
  `y` entre 8 e 48 — research.md §4, acima de `SHELF_Y_POSITIONS[0] - 40 = 120`), inicializado a
  partir de `matchStateManager.getSnapshot().foodRemainingCount`/`foodTotalCount` (ex.: texto
  `"9 / 9"`)
- [X] T006 [US1] Em `create()` de `client/src/scenes/GameScene.ts`, adicionar um método privado
  `updateHud(snapshot: MatchSnapshot)` que atualiza o texto do HUD criado em T005, e assiná-lo ao
  evento `food:stolen` já existente na lista `this.unsubscribers` (junto aos listeners de
  `roach:eliminated`/`food:stolen`/`match:lost`), relendo `matchStateManager.getSnapshot()` a cada
  chamada (depende de T005)
- [X] T007 [US1] Validar manualmente os cenários 1–3 do `specs/002-hud-progresso-risco/quickstart.md`
  (estado inicial do HUD, atualização ao roubo, ausência de mudança ao eliminar barata) rodando
  `bun run dev` em `client/`

**Checkpoint**: User Story 1 completa e testável de forma independente — HUD numérico funcional,
sem indicação visual de risco ainda (isso é a User Story 2).

---

## Phase 4: User Story 2 - Perceber a proximidade da derrota (Priority: P2)

**Goal**: Reforçar o número do HUD com uma indicação visual de risco em três níveis — seguro
(>50% restante), risco elevado (≤50%, mais de 1 restante), crítico (exatamente 1 restante) —
conforme FR-005 e a clarificação registrada em `spec.md`.

**Independent Test**: reduzir as comidas restantes até 50% ou menos do total e confirmar que o
indicador muda visualmente para "risco elevado"; continuar até restar 1 e confirmar a mudança
para "crítico", visualmente distinto do nível anterior.

### Tests for User Story 2

- [X] T008 [US2] Escrever testes que falham para `riskLevel(match)` em
  `client/tests/unit/match.hud.test.ts`, cobrindo os três limiares de `data-model.md` §
  "RiskLevel": >50% restante → `'safe'`; ≤50% restante e mais de 1 → `'elevated'`; exatamente 1
  restante → `'critical'` (usar `createMatch()`/`markStolen` para montar cada cenário)

### Implementation for User Story 2

- [X] T009 [US2] Implementar o tipo `RiskLevel = 'safe' | 'elevated' | 'critical'` e a função pura
  `riskLevel(match): RiskLevel` em `client/src/entities/Match.ts`, usando
  `foodRemainingCount`/`foodTotalCount` (T003) e os limiares exatos de FR-005 — faz T008 passar
  (depende de T008, T003)
- [X] T010 [US2] Estender `MatchSnapshot` em `client/src/systems/MatchStateManager.ts` com
  `readonly riskLevel: RiskLevel`, calculado em `getSnapshot()` via `riskLevel()` de T009 (depende
  de T009, T004)
- [X] T011 [US2] Em `create()` de `client/src/scenes/GameScene.ts`, criar um
  `Phaser.GameObjects.Graphics` para a barra de risco, posicionada junto ao texto do HUD (T005),
  desenhada a partir de `matchStateManager.getSnapshot().riskLevel` com uma cor fixa por nível
  (`'safe'` → verde, `'elevated'` → amarelo, `'critical'` → vermelho — research.md §3) (depende de
  T005, T010)
- [X] T012 [US2] Em `updateHud()` (T006) de `client/src/scenes/GameScene.ts`, redesenhar a
  `Graphics` da barra apenas quando `riskLevel` mudar desde a última atualização (guardar o último
  nível em um campo privado da scene, evitando `clear()`/`fillRect()` incondicional a cada evento —
  Princípio V) (depende de T006, T011)
- [X] T013 [US2] Validar manualmente o cenário 4 do
  `specs/002-hud-progresso-risco/quickstart.md` (transições seguro → risco elevado → crítico)
  rodando `bun run dev` em `client/`

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente — HUD numérico + indicador
visual de risco completos.

---

## Phase 5: User Story 3 - Ver o estado do HUD ao reiniciar a partida (Priority: P3)

**Goal**: Garantir que o HUD volta ao estado inicial (contagem total, nível "seguro") assim que o
jogador reinicia após uma derrota, e que não aparece fora da tela de jogo (FR-006, FR-008).

**Independent Test**: jogar até a derrota, reiniciar a partir da tela final, e confirmar que o HUD
mostra a contagem total original e o nível "seguro" antes de qualquer novo spawn; confirmar que o
HUD não aparece na tela inicial nem na tela final.

### Implementation for User Story 3

- [X] T014 [US3] Validar manualmente os cenários 5–6 do
  `specs/002-hud-progresso-risco/quickstart.md` (HUD ausente em `StartScene`/`GameOverScene`,
  incluindo a ausência de "flash" do nível crítico no instante exato da derrota; HUD redefinido
  corretamente em pelo menos 3 ciclos seguidos de derrota→reinício, per SC-004). Nenhuma alteração
  de código é esperada nesta tarefa: o HUD é criado em `create()` de `GameScene` (T005/T011) a
  partir de um snapshot já correto após `matchStateManager.restart()` (`match:started` →
  `GameOverScene` troca para `GameScene` antes de qualquer novo `tick()`), e nunca existe fora
  dessa scene. Caso a validação manual encontre um desvio, registrar e corrigir em
  T005/T006/T011 antes de marcar esta tarefa como concluída.

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta.

- [X] T015 Rodar a validação manual completa de `specs/002-hud-progresso-risco/quickstart.md`
  (todos os 7 cenários) em sequência, em uma única partida jogada do início à derrota e reinício
- [X] T016 [P] Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte
  existente do MVP (`client/tests/unit/`) além dos novos testes de `match.hud.test.ts`
- [X] T017 Verificar o critério de performance SC-003 (`spec.md`) com o painel de performance do
  navegador aberto durante uma partida completa: confirmar 60 FPS estável e nenhum atraso
  perceptível entre clique e remoção da barata com o HUD visível

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup — BLOQUEIA a User Story 1
- **User Story 1 (Phase 3)**: depende de Foundational (T004) — é o MVP
- **User Story 2 (Phase 4)**: depende de Foundational (T004) e de `GameScene` já ter o HUD de
  texto (T005/T006 da US1), pois a barra de risco é desenhada ao lado do texto existente
- **User Story 3 (Phase 5)**: depende de US1 (T005/T006) e US2 (T011) já implementados — é
  puramente uma validação do comportamento de reinício já correto por construção
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Foundational — nenhuma dependência de outra story
- **User Story 2 (P2)**: depende de Foundational e reaproveita o objeto de texto criado pela US1
  (não é estritamente independente no código, mas é independentemente **testável**: dá para
  validar US1 sozinha antes de a barra de risco existir)
- **User Story 3 (P3)**: depende de US1 e US2 já estarem implementadas — é uma validação de que o
  ciclo de vida de `GameScene`/`MatchStateManager` já cobre o caso de reinício corretamente

### Within Each User Story

- Testes (quando incluídos) escritos e falhando antes da implementação (T002→T003, T008→T009)
- Funções de domínio antes da extensão do snapshot (T003→T004, T009→T010)
- Snapshot estendido antes do desenho na scene (T004→T005, T010→T011)
- Criação do game object antes de sua atualização reativa a eventos (T005→T006, T011→T012)

### Parallel Opportunities

- Dentro de cada fase, as tarefas formam uma cadeia estritamente sequencial (mesmos arquivos
  compartilhados: `Match.ts`, `MatchStateManager.ts`, `GameScene.ts`) — não há tarefas
  verdadeiramente paralelizáveis dentro de uma mesma user story
- T016 (rodar a suíte `bun test` completa) pode ser feito em paralelo com a validação manual T015

---

## Parallel Example: Polish

```bash
# T015 (validação manual) e T016 (suíte automatizada) podem rodar ao mesmo tempo:
Task: "Rodar validação manual completa do quickstart.md"
Task: "bun test (suíte completa em client/)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia a User Story 1)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T007)
5. Neste ponto já existe o item P0 mínimo do backlog: contador visível de comidas restantes

### Incremental Delivery

1. Setup + Foundational → base pronta
2. User Story 1 → testar independentemente → HUD numérico funcional (MVP do item de backlog)
3. User Story 2 → testar independentemente → indicador visual de risco em 3 níveis
4. User Story 3 → validar → comportamento de reinício confirmado (sem código novo)
5. Polish → validação de ponta a ponta e regressão da suíte de testes

---

## Notes

- [P] = arquivos diferentes, sem dependência — usado aqui apenas na Phase 6, já que as demais
  fases editam sequencialmente os mesmos três arquivos compartilhados
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Escrever os testes de T002/T008 primeiro e confirmar que falham antes de implementar T003/T009
- Rodar `bun test` após cada tarefa de implementação de domínio (T003, T004, T009, T010)
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
- **SC-001** (90% dos jogadores identificam corretamente o risco) é uma métrica de usabilidade
  qualitativa, validada por observação informal de jogadores reais — fora do escopo das tasks de
  desenvolvimento acima (`/speckit-analyze`, achado C1). Não bloqueia `/speckit-implement`; é
  responsabilidade de produto/QA medir após o deploy, junto às demais métricas do PRD (backlog.md
  § 5, "5 feedbacks qualitativos").
- **FR-004** (HUD não muda ao eliminar barata) é validado apenas manualmente em T007, sem teste
  automatizado dedicado na camada de scene — aceitável porque os testes já existentes do MVP
  (`client/tests/unit/matchStateManager.eliminate.test.ts`) já garantem que eliminar uma barata
  nunca emite `food:stolen`, a causa raiz que uma regressão em FR-004 exigiria (`/speckit-analyze`,
  achado C4).
