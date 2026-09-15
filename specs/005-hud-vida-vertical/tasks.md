---

description: "Task list template for feature implementation"
---

# Tasks: Reposicionamento e Restilização do HUD

**Input**: Design documents from `/specs/005-hud-vida-vertical/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: nenhuma — `research.md §5` decide explicitamente por não criar testes automatizados
novos: esta feature não adiciona nem altera nenhuma função pura de domínio, então a suíte `bun
test` existente já cobre os valores lidos pelo HUD (`foodRemainingCount`, `foodTotalCount`,
`riskLevel`, `score`) sem modificação. Validação é manual via `quickstart.md`.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/`, `client/public/`, `client/index.html` (ver `plan.md` → Project
Structure). Nenhuma pasta nova é criada, exceto o arquivo de fonte em
`client/public/assets/fonts/` (pasta já reservada, hoje só com `.gitkeep`). Nenhum arquivo de
teste é criado ou alterado nesta feature.

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em arquivos compartilhados
(`scenes/GameScene.ts`, `scenes/BootScene.ts`, `index.html`).

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente (MVP + specs
  002/003/004) passa antes de iniciar qualquer alteração (baseline; nenhuma dependência nova é
  necessária — `plan.md` § Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura verdadeiramente compartilhada por mais de uma user story.

**Nota**: esta feature não tem um bloqueador comum às três stories — User Story 1 (reposicionamento
da barra/contador) é totalmente independente da fonte cartunesca, e User Story 2/3 (fonte) são
independentes da geometria da barra. Por isso a fase Foundational fica vazia por design: cada
story traz seus próprios pré-requisitos na sua própria fase (ver T002 em US1 para as constantes de
geometria, e T007-T009 em US2 para o asset/carregamento da fonte, reaproveitado por US3).

**Checkpoint**: nenhum bloqueio — User Story 1 e User Story 2 podem começar em paralelo assim que
Setup (Phase 1) terminar.

---

## Phase 3: User Story 1 - Ver a vida/risco como uma barra vertical no canto superior direito (Priority: P1) 🎯 MVP

**Goal**: Mover o contador de comidas restantes e a barra de risco para um agrupamento no canto
superior direito da tela, com a barra desenhada na vertical, preenchimento contínuo da base para o
topo, preservando a lógica de proporção/cor por nível de risco já existente (FR-001 a FR-004,
FR-009 parcial).

**Independent Test**: iniciar uma partida e verificar que o contador numérico e a barra aparecem
juntos no canto superior direito, com a barra na vertical; deixar uma comida ser roubada e
confirmar que a barra e o contador atualizam corretamente nessa nova posição/orientação.

### Implementation for User Story 1

- [X] T002 [US1] Em `client/src/scenes/GameScene.ts`, substituir as constantes locais
  `HUD_BAR_WIDTH`, `HUD_BAR_HEIGHT`, `HUD_BAR_Y` pelas novas constantes de geometria do
  agrupamento canto superior direito: `HUD_MARGIN_RIGHT = 36`, `HUD_BAR_THICKNESS = 16`,
  `HUD_BAR_LENGTH = 160`, `HUD_BAR_TOP_Y = 56`, `HUD_LIFE_COUNTER_Y = 32` (data-model.md §
  "Constantes de apresentação"; `HUD_BAR_TRACK_COLOR` e `HUD_RISK_COLORS` permanecem inalterados).
  **Importante**: `SCORE_TEXT_Y` (hoje `HUD_BAR_Y + HUD_BAR_HEIGHT + 8`) depende diretamente de
  `HUD_BAR_Y`/`HUD_BAR_HEIGHT` — para US1 continuar compilando e testável de forma independente
  (T005), substituir a definição de `SCORE_TEXT_Y` por um literal temporário equivalente ao valor
  atual (`const SCORE_TEXT_Y = 52;`) em vez de deixá-la referenciando as constantes removidas;
  T009 (US2) remove `SCORE_TEXT_Y` por completo quando `scoreText` for reposicionado
  (`/speckit-analyze`, achado I1)
- [X] T003 [US1] Em `create()` de `client/src/scenes/GameScene.ts`, reposicionar o
  `Phaser.GameObjects.Text` do contador de comidas restantes (`hudText`) de
  `(GAME_WIDTH / 2, 12)` para `(GAME_WIDTH - HUD_MARGIN_RIGHT - HUD_BAR_THICKNESS / 2,
  HUD_LIFE_COUNTER_Y)`, mantendo `setOrigin(0.5, 0)` (research.md §2) (depende de T002)
- [X] T004 [US1] Reescrever `redrawHudBar()` em `client/src/scenes/GameScene.ts` para desenhar a
  barra na vertical: trilho (`HUD_BAR_TRACK_COLOR`) como `fillRect(x, HUD_BAR_TOP_Y,
  HUD_BAR_THICKNESS, HUD_BAR_LENGTH)`, onde `x = GAME_WIDTH - HUD_MARGIN_RIGHT -
  HUD_BAR_THICKNESS`; preenchimento colorido por `riskLevel` (`HUD_RISK_COLORS`) como
  `fillRect(x, HUD_BAR_TOP_Y + (HUD_BAR_LENGTH - filledHeight), HUD_BAR_THICKNESS,
  filledHeight)`, onde `filledHeight = HUD_BAR_LENGTH * ratio` — preenchendo da base para o topo
  (research.md §1) (depende de T002)
- [X] T005 [US1] Validar manualmente o cenário 1 do
  `specs/005-hud-vida-vertical/quickstart.md` (agrupamento vida/barra no canto superior direito)
  rodando `bun run dev` em `client/` — confirmar que a barra não sobrepõe a prateleira superior
  nem nenhuma comida (depende de T003, T004)

**Checkpoint**: User Story 1 completa e testável de forma independente — contador e barra de risco
já aparecem reposicionados e reorientados no canto superior direito, sem nenhuma mudança de fonte
ainda.

---

## Phase 4: User Story 2 - Ler a pontuação com destaque e estilo cartunesco (Priority: P2)

**Goal**: Exibir a pontuação, centralizada horizontalmente no topo, em 28px e na fonte cartunesca
"Fredoka", em vez do tamanho/fonte padrão atuais (FR-005, FR-006, FR-007).

**Independent Test**: iniciar uma partida e comparar visualmente a pontuação exibida com o
tamanho/fonte anteriores (fonte padrão, 16px); confirmar que agora está em 28px e usa a fonte
"Fredoka", mantendo a posição horizontal centralizada atual.

### Implementation for User Story 2

- [X] T006 [P] [US2] Adicionar o arquivo de fonte `Fredoka-Bold.woff2` (Google Fonts, licença
  OFL) em `client/public/assets/fonts/Fredoka-Bold.woff2` (Princípio VI — asset versionado;
  research.md §3)
- [X] T007 [P] [US2] Em `client/index.html`, adicionar uma declaração `@font-face` para
  `"Fredoka"` apontando para `/assets/fonts/Fredoka-Bold.woff2`, com `font-weight: 700;` e
  `font-display: swap`, dentro do `<style>` já existente (research.md §3). **Importante**:
  declarar `font-weight: 700` explicitamente — sem isso, a face é registrada como peso `400`
  (padrão) e o pedido `'bold 28px "Fredoka"'` de T008 arrisca não casar com ela, fazendo o gate de
  carregamento sempre cair no timeout de fallback (`/speckit-analyze`, achado U1) (depende de
  T006)
- [X] T008 [US2] Em `client/src/scenes/BootScene.ts`, antes de `this.scene.start("StartScene")`
  em `create()`, chamar `document.fonts.load('bold 28px "Fredoka"')` e aguardar a Promise
  resultante com um teto de 1s (`Promise.race` com um timeout), para que a fonte já esteja
  disponível quando `GameScene` criar seus textos (research.md §3) (depende de T007)
- [X] T009 [US2] Em `client/src/scenes/GameScene.ts`, adicionar as constantes locais
  `SCORE_FONT_SIZE_PX = 28` e `HUD_FONT_FAMILY = '"Fredoka", "Comic Sans MS", cursive,
  sans-serif'`, e remover a constante `SCORE_TEXT_Y` (obsoleta — dependia da barra horizontal
  removida em US1) (data-model.md § "Constantes de apresentação") (depende de T002)
- [X] T010 [US2] Em `create()` de `client/src/scenes/GameScene.ts`, atualizar a criação do
  `scoreText`: posição `(GAME_WIDTH / 2, 12)` (liberada pelo reposicionamento do contador de vida
  em US1/T003), estilo `{ fontSize: \`${SCORE_FONT_SIZE_PX}px\`, fontFamily: HUD_FONT_FAMILY,
  color: "#000000" }`, mantendo `setOrigin(0.5, 0)` (FR-005, FR-006, FR-007) (depende de T003,
  T009)
- [X] T011 [US2] Validar manualmente o cenário 2 do `specs/005-hud-vida-vertical/quickstart.md`
  (pontuação maior e cartunesca) rodando `bun run dev` em `client/` (depende de T008, T010)

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente — pontuação já em destaque
visual, com o agrupamento vida/barra já reposicionado.

---

## Phase 5: User Story 3 - Consistência visual entre os textos do HUD (Priority: P3)

**Goal**: Aplicar a mesma família de fonte "Fredoka" ao contador de comidas restantes, para que os
dois textos do HUD usem o mesmo sistema visual (FR-008).

**Independent Test**: com o HUD reposicionado e a pontuação já na fonte cartunesca, comparar a
fonte do contador de comidas restantes com a da pontuação e confirmar que ambas usam a mesma
família tipográfica.

### Implementation for User Story 3

- [X] T012 [US3] Em `create()` de `client/src/scenes/GameScene.ts`, adicionar `fontFamily:
  HUD_FONT_FAMILY` ao estilo do `hudText` (contador de comidas restantes) criado em T003,
  mantendo o tamanho atual (18px) — reaproveita a constante `HUD_FONT_FAMILY` já definida em T009,
  sem alterar `SCORE_FONT_SIZE_PX` nem nenhum outro estilo do contador (FR-008; research.md §4)
  (depende de T003, T009)
- [X] T013 [US3] Validar manualmente o cenário 3 do `specs/005-hud-vida-vertical/quickstart.md`
  (consistência de fonte entre contador de vida e pontuação) rodando `bun run dev` em `client/`
  (depende de T012)

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto — HUD
reposicionado e restilizado por completo.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta.

- [X] T014 Rodar a validação manual completa de `specs/005-hud-vida-vertical/quickstart.md`
  (cenários 1-5, incluindo o fallback de fonte simulando falha de carregamento do `.woff2` nas
  DevTools) em `client/` via `bun run dev`
- [X] T015 [P] Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte
  existente (MVP + specs 002/003/004) — nenhum teste novo é esperado (research.md §5)
- [X] T016 Verificar o critério de performance SC-002 (`spec.md`) com o painel de performance do
  navegador aberto durante uma partida completa: confirmar 60 FPS estável e nenhum atraso
  perceptível entre clique e remoção da barata, mesmo com o novo agrupamento de HUD no canto
  superior direito

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: vazia por design (ver nota acima) — não bloqueia nenhuma story além
  de Setup
- **User Story 1 (Phase 3)**: depende apenas de Setup — é o MVP
- **User Story 2 (Phase 4)**: depende apenas de Setup para a parte de fonte (T006-T009), mas
  T010 depende da posição definida por T003 (US1), já que a pontuação ocupa o espaço liberado pelo
  contador de vida reposicionado
- **User Story 3 (Phase 5)**: depende de US1 (T003, contador criado) e de US2 (T009, constante
  `HUD_FONT_FAMILY` definida) — reaproveita ambos sem duplicar trabalho
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: independente — nenhuma dependência de outra story
- **User Story 2 (P2)**: a parte de fonte (T006-T009) é independente; a posição final do
  `scoreText` (T010) reaproveita o `x`/reposicionamento de US1, mas é independentemente
  **testável** (dá para validar a fonte/tamanho da pontuação isoladamente, mesmo que o
  posicionamento final dependa de US1 já ter rodado)
- **User Story 3 (P3)**: depende de US1 (T003) e US2 (T009) já existirem — não é independente no
  código (reaproveita a mesma constante de fonte e o mesmo texto criados por elas), mas é
  independentemente **testável**: dá para validar US1+US2 sem a fonte do contador de vida ainda
  trocada, antes desta fase existir

### Within Each User Story

- Constantes antes da criação/atualização dos game objects (T002→T003/T004, T009→T010/T012)
- Asset e `@font-face` antes do carregamento em `BootScene` (T006→T007→T008)
- Story completa (incluindo validação manual) antes de avançar para a próxima prioridade

### Parallel Opportunities

- T006 (asset de fonte) e T007 (`@font-face` em `index.html`) tocam arquivos diferentes de
  qualquer tarefa de US1, por isso US1 e o início de US2 podem ser trabalhados em paralelo por
  pessoas diferentes
- T015 (suíte automatizada) pode rodar em paralelo com a validação manual T014/T016

---

## Parallel Example: User Story 2

```bash
# Preparar a fonte em paralelo com o início de User Story 1:
Task: "Adicionar Fredoka-Bold.woff2 em client/public/assets/fonts/"
Task: "Adicionar @font-face para Fredoka em client/index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 3: User Story 1
3. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T005)
4. Neste ponto o agrupamento vida/barra já está no canto superior direito, na vertical — o pedido
   estruturalmente mais visível da feature já está entregue

### Incremental Delivery

1. Setup → base pronta
2. User Story 1 → testar independentemente → agrupamento vida/barra reposicionado
3. User Story 2 → testar independentemente → pontuação maior e cartunesca
4. User Story 3 → testar independentemente → contador de vida usa a mesma fonte da pontuação
5. Polish → validação de ponta a ponta e regressão da suíte de testes

---

## Notes

- [P] = arquivos diferentes, sem dependência
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Nenhum teste automatizado novo é escrito nesta feature (research.md §5) — rodar `bun test` apenas
  para confirmar ausência de regressão (T001, T015)
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
- `FR-011` (nenhuma regra de domínio muda) é satisfeito por construção: nenhuma task desta lista
  toca `entities/Match.ts` ou `systems/MatchStateManager.ts`
- `FR-010` (HUD só aparece na tela de jogo) é satisfeito por construção: nenhuma task desta lista
  toca `scenes/StartScene.ts` ou `scenes/GameOverScene.ts`
- T005, T011, T013, T014 e T016 (validação manual via navegador) foram validadas manualmente pelo
  usuário rodando `bun run dev` — todas as tasks da feature estão concluídas
