---

description: "Task list template for feature implementation"
---

# Tasks: High Score Local

**Input**: Design documents from `/specs/012-high-score-local/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/high-score-store.md, quickstart.md

**Revisão pós-implementação (2026-09-19)**: a primeira versão destas tasks implementou um recorde
único (`getHighScore`/`recordScore` com `number | null`/`isNewHighScore`) e foi totalmente
concluída e testada (84/84 testes, build limpo). O dono do produto validou manualmente e pediu um
ranking Top 5 em vez de um valor único (`spec.md` → Clarifications). As tasks abaixo foram
reescritas para o novo contrato (`getRanking`/`recordScore` com `position`); tasks cujo trabalho
já concluído permanece válido em espírito (ex. estrutura do módulo, padrão de teste com fake de
`localStorage`) foram marcadas como tal nas Notes, mas o código em si precisa ser reescrito porque
o formato de dado mudou de um número para um array.

**Tests**: incluídas — `plan.md` § Technical Context já decide por `bun test` cobrindo
`HighScoreStore` com um fake de `localStorage`, seguindo o mesmo padrão já estabelecido por
`specs/007-tempo-de-sobrevivencia`/`specs/011-dificuldade-progressiva`.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/config/gameConfig.ts`, `client/src/systems/HighScoreStore.ts`,
`client/src/scenes/StartScene.ts`, `client/src/scenes/GameOverScene.ts`,
`client/tests/unit/highScoreStore.test.ts` (todos já existem da implementação anterior; esta
revisão reescreve o conteúdo, não cria arquivos novos). Nenhuma pasta nova é criada; `entities/`,
`MatchStateManager.ts` e `CollisionSystem.ts` permanecem intocados.

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de reescrever o módulo.

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar a revisão (baseline: 84/84 — 74 do MVP/specs anteriores + 10 da primeira versão do
  recorde único, que serão reescritos nesta revisão)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reescrever o módulo `HighScoreStore` completo para o formato de ranking (array de até
5 posições), com toda a resiliência a valor ausente/corrompido/formato antigo, testado
isoladamente antes de religar às scenes. Ambas as user stories de exibição (US1, US2) dependem
deste módulo.

**⚠️ CRITICAL**: Nenhuma user story pode ficar correta antes desta fase estar completa.

- [X] T002 Em `client/src/config/gameConfig.ts`, adicionar
  `export const HIGH_SCORE_RANKING_MAX_ENTRIES = 5;` ao lado de `HIGH_SCORE_STORAGE_KEY` já
  existente (data-model.md § "Constantes novas")
- [X] T003 Reescrever `client/tests/unit/highScoreStore.test.ts` (arquivo já existe, conteúdo da
  versão de recorde único é substituído) cobrindo `getRanking()`/`recordScore()` para o formato de
  ranking:
  (a) `getRanking()` retorna `[]` quando nada foi salvo ainda (FR-007);
  (b) `getRanking()` retorna `[]` quando o valor salvo está corrompido (ex. `"abc"`) ou é um
  array com valores não-numéricos/negativos (FR-010);
  (c) `getRanking()` retorna `[]` quando o valor salvo está no formato antigo de número único (ex.
  `"120"`, que `JSON.parse` converte para um `number`, falhando em `Array.isArray`) (FR-010,
  research.md §6);
  (d) `recordScore(score)` com ranking vazio ou com menos de 5 entradas sempre insere `score` e
  retorna `position` correspondente à posição dele no array ordenado (FR-002, US1 cenários 1-2);
  (e) `recordScore(score)` com ranking já com 5 entradas e `score` maior que a menor delas insere
  `score`, remove a menor entrada anterior, e retorna `ranking` com exatamente 5 entradas e a
  `position` de `score` (FR-002, FR-003, US1 cenário 3);
  (f) `recordScore(score)` com ranking já com 5 entradas e `score` igual ou menor que a menor delas
  não altera `ranking` e retorna `position: null` (FR-004, US1 cenário 4);
  (g) o `ranking` retornado por `getRanking()`/`recordScore()` está sempre ordenado da maior para a
  menor pontuação
  (contracts/high-score-store.md, data-model.md) (depende de T002)
- [X] T004 Reescrever `client/src/systems/HighScoreStore.ts` (arquivo já existe, conteúdo da versão
  de recorde único é substituído, sem `import Phaser`): uma função interna `readStoredRanking()`
  que lê `localStorage.getItem(HIGH_SCORE_STORAGE_KEY)` atrás de
  `typeof localStorage !== "undefined"` e `try/catch`, faz `JSON.parse` e retorna `[]` para
  ausência, exceção, resultado que não seja um array (cobre o formato antigo de número único), ou
  array com algum elemento que não passe em `Number.isFinite(v) && v >= 0`, sempre devolvendo o
  array ordenado da maior para a menor; `getRanking()` retornando `readStoredRanking()`;
  `recordScore(score)` decidindo se `score` entra (`ranking.length < HIGH_SCORE_RANKING_MAX_ENTRIES
  || score > Math.min(...ranking)`), inserindo e cortando para `HIGH_SCORE_RANKING_MAX_ENTRIES`
  entradas, persistindo via `localStorage.setItem(key, JSON.stringify(updated))` (também em
  `try/catch`) quando inserir, e calculando `position` via `updated.indexOf(score) + 1` (ou `null`
  se não inseriu) — faz T003 passar (contracts/high-score-store.md) (depende de T003)
- [X] T005 Rodar `bun test` em `client/` e confirmar que T003 passa e que não há regressões na
  suíte existente (depende de T004)

**Checkpoint**: `getRanking()`/`recordScore()` prontas e testadas isoladamente para o formato de
ranking; as scenes ainda chamam a API antiga (`getHighScore`/`isNewHighScore`) e por isso não
compilam — corrigido nas fases seguintes.

---

## Phase 3: User Story 1 - Jogador entra no ranking e vê isso reconhecido (Priority: P1) 🎯 MVP

**Goal**: Ao terminar uma partida cuja pontuação entra no Top 5, indicar claramente na tela de
derrota a posição alcançada (FR-002, FR-003, FR-004, FR-005).

**Independent Test**: jogar partidas repetidas vezes anotando a pontuação final de cada uma;
confirmar que a tela de derrota indica a posição alcançada quando a pontuação entra no Top 5, e
que isso não acontece quando fica fora dele.

### Implementation for User Story 1

- [X] T006 [US1] Em `client/src/scenes/GameOverScene.ts`: trocar o import de `recordScore` (já
  existente, mesmo módulo) e atualizar a chamada de `const { isNewHighScore } = recordScore(score);`
  para `const { position } = recordScore(score);`; substituir a condição `if (isNewHighScore)` por
  `if (position !== null)`, e o texto fixo "Novo recorde!" por um texto que inclua a posição (ex.:
  `` `Top 5 — ${position}º lugar!` `` quando `position > 1`, ou "Novo recorde!" quando
  `position === 1`), mantendo o mesmo reposicionamento condicional do botão "Reiniciar"
  (contracts/high-score-store.md § Chamadores, FR-005) (depende de T004)
- [ ] T007 [~] [US1] Validar manualmente os cenários 1–4 do
  `specs/012-high-score-local/quickstart.md` (primeira partida entra no ranking; ranking preenche
  até 5 posições; entrada desloca a menor pontuação quando cheio; pontuação não entra quando cheio
  e menor/igual) rodando `bun run dev` em `client/`

**Checkpoint**: User Story 1 completa e testável de forma independente — a tela de derrota
reconhece entradas no ranking com a posição correta.

---

## Phase 4: User Story 2 - Jogador vê o ranking atual antes de começar a jogar (Priority: P2)

**Goal**: Exibir o ranking salvo (até 5 pontuações, em ordem decrescente) na tela inicial, ou a
ausência dele (FR-006, FR-007).

**Independent Test**: jogar partidas suficientes para preencher o ranking, voltar à tela inicial e
confirmar que a lista exibida reflete as pontuações das partidas anteriores, na ordem correta,
mesmo após fechar e reabrir o navegador.

### Implementation for User Story 2

- [X] T008 [US2] Em `client/src/scenes/StartScene.ts`: trocar o import de `getHighScore` (já
  existente, mesmo módulo) para `getRanking`; atualizar `create()` para chamar
  `const ranking = getRanking();` e substituir o texto único por uma exibição de lista: "Nenhuma
  partida registrada ainda" quando `ranking.length === 0`, ou uma lista numerada (ex.:
  `` `${index + 1}. ${value}` `` por linha, unidas com `\n`) das entradas de `ranking` caso
  contrário (contracts/high-score-store.md § Chamadores, FR-006, FR-007) (depende de T004)
- [ ] T009 [~] [US2] Validar manualmente o cenário 5 do `specs/012-high-score-local/quickstart.md`
  (ranking visível na tela inicial, incluindo "nenhuma partida registrada ainda" antes da primeira
  partida, ordem decrescente, e persistência após fechar/reabrir o navegador) rodando `bun run dev`

**Checkpoint**: User Stories 1 e 2 completas — ranking é reconhecido ao ser alcançado e visível
antes de cada partida.

---

## Phase 5: User Story 3 - Ranking continua confiável mesmo sem armazenamento disponível (Priority: P3)

**Goal**: Confirmar explicitamente, com testes dedicados, que uma falha de `localStorage` (não
apenas um valor corrompido ou no formato antigo, já cobertos na Fase 2) nunca propaga exceção nem
trava o fim de partida (FR-009).

**Independent Test**: simular indisponibilidade do `localStorage` (getItem/setItem lançando
exceção) e confirmar que `getRanking()`/`recordScore()` continuam retornando valores seguros sem
lançar.

### Tests for User Story 3

- [X] T010 [US3] Escrever/confirmar em `client/tests/unit/highScoreStore.test.ts` os testes que
  atribuem a `globalThis.localStorage` um fake cujos `getItem`/`setItem` lançam exceção (ex.:
  `{ getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } }`);
  confirmar que `getRanking()` retorna `[]` sem lançar, e que `recordScore(score)` retorna
  `{ ranking: [score], position: 1 }` sem lançar mesmo quando a escrita falha (FR-009,
  contracts/high-score-store.md) — já deve passar sem nenhuma mudança de implementação, pois o
  `try/catch` de T004 já cobre isso; se falhar, ajustar
  `client/src/systems/HighScoreStore.ts` (depende de T004)

### Implementation for User Story 3

- [X] T011 [US3] Rodar `bun test` em `client/` e confirmar que T010 passa sem regressões (depende
  de T010)
- [ ] T012 [~] [US3] Validar manualmente o cenário 6 do `specs/012-high-score-local/quickstart.md`
  (partida completa sem travar com `localStorage` bloqueado/indisponível, ex. em janela privada
  restritiva) rodando `bun run dev`

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto — ranking é
reconhecido, visível e resiliente a falhas de armazenamento.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo garantias satisfeitas por construção (research.md, sem task
de implementação dedicada) e regressão de ponta a ponta.

- [ ] T013 [~] Validar manualmente o cenário 7 do `specs/012-high-score-local/quickstart.md`
  (reiniciar a partir da tela de derrota não afeta o ranking salvo — FR-011, satisfeito por
  construção porque `restart()`/`start()` nunca chamam `HighScoreStore`) rodando `bun run dev`
- [X] T014 [P] Rodar `bun test` completo em `client/` e `bun run build` em `client/` e confirmar
  zero regressões na suíte existente (MVP + specs anteriores) e build limpo com o
  `highScoreStore.test.ts` reescrito

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup — BLOQUEIA todas as user stories (as scenes não
  compilam contra a API antiga até esta fase terminar)
- **User Story 1 (Phase 3)**: depende de Foundational (T004) — é o MVP
- **User Story 2 (Phase 4)**: depende de Foundational (T004) — não depende da US1 (arquivo/scene
  diferente)
- **User Story 3 (Phase 5)**: depende de Foundational (T004); testa o mesmo módulo que US1/US2 já
  usam, mas por um ângulo diferente (falha de storage, não valor corrompido/formato antigo)
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Foundational — nenhuma dependência de outra story
- **User Story 2 (P2)**: depende apenas de Foundational — independente de US1 (`StartScene.ts` vs.
  `GameOverScene.ts`, nenhum arquivo em comum)
- **User Story 3 (P3)**: depende apenas de Foundational — adiciona cobertura de teste sobre o
  mesmo módulo, sem exigir que US1/US2 já estejam com suas scenes ligadas

### Within Each User Story

- Testes escritos e falhando antes da implementação na Fase 2 (T003 → T004); US1/US2 são wiring de
  scene sem teste automatizado próprio (mesmo padrão de `GameOverScene`/`StartScene` em specs
  anteriores — Phaser não é unit-testado neste projeto), validadas manualmente via quickstart
- T010 (US3) depende de T004, mas não de T006/T008 (US1/US2) — testa o módulo diretamente, não as
  scenes
- Story completa (incluindo validação manual) antes de avançar para a próxima prioridade

### Parallel Opportunities

- T006 (US1, `GameOverScene.ts`) e T008 (US2, `StartScene.ts`) tocam arquivos diferentes e
  dependem apenas de T004 — podem ser feitas em paralelo
- T010 (US3, mesmo arquivo de teste de T003) depende apenas de T004, não de T006/T008 — pode ser
  feita em paralelo com a Fase 3/4
- T014 (suíte automatizada + build) pode rodar em paralelo com a validação manual T013

---

## Parallel Example: User Stories 1 e 2

```bash
# Podem rodar ao mesmo tempo, uma vez que T004 esteja pronta:
Task: "Ligar recordScore/position em GameOverScene.ts (T006)"
Task: "Ligar getRanking em StartScene.ts (T008)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T007)
5. Neste ponto já existe o núcleo do item P0 do backlog revisado ("ranking local") — entrada no
   Top 5 é reconhecida; o ranking ainda não é visível antes da partida

### Incremental Delivery

1. Setup + Foundational → `HighScoreStore` reescrito para ranking, pronto e testado, nenhuma scene
   ainda reflete o novo formato de retorno
2. User Story 1 → testar independentemente → tela de derrota reconhece entradas no ranking
3. User Story 2 → testar independentemente → tela inicial mostra o Top 5 atual
4. User Story 3 → testar independentemente → resiliência a falha de storage confirmada
5. Polish → validação de ponta a ponta (incluindo reinício) e regressão da suíte + build

---

## Notes

- [P] = arquivos diferentes ou sem dependência de tarefa incompleta
- [~] = validação manual (não automatizada), mesma convenção de `specs/011-dificuldade-progressiva`
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Esta revisão reaproveita a estrutura de arquivos e o padrão de teste (fake de `localStorage` via
  `globalThis`) já validados na primeira implementação — apenas o formato de dado e as assinaturas
  de `getRanking`/`recordScore` mudaram; ver research.md §6 para o racional completo da mudança
- Rodar `bun test` após cada tarefa de implementação de domínio (T005, T011, T014)
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
- FR-008 (persiste entre sessões do navegador) é satisfeito por construção — é o comportamento
  nativo de `localStorage`; validado manualmente no cenário 5 do quickstart (T009), sem task de
  implementação dedicada
- FR-011 (reiniciar não afeta o ranking salvo) é satisfeito por omissão — nenhuma task desta
  feature toca `MatchStateManager.start()`/`restart()`; validado manualmente em T013
- Nenhuma task desta feature toca `entities/Match.ts`, `MatchStateManager.ts` ou
  `CollisionSystem.ts` — o ranking é lido/escrito só nas bordas de scene (início e fim de partida)
