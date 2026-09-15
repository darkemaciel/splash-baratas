---

description: "Task list template for feature implementation"
---

# Tasks: Responsividade mobile e compatibilidade de tela

**Input**: Design documents from `/specs/006-responsividade-mobile/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Nenhum teste `bun test` novo é gerado — `research.md` (Decisão 6) determinou que esta
feature não cria/altera nenhuma função de domínio; a validação é manual, via `quickstart.md`.

**Organization**: Tasks agrupadas por user story (spec.md) para permitir validação independente de
cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: A qual user story esta task pertence (US1, US2, US3)
- Caminhos de arquivo exatos incluídos nas descrições

## Path Conventions

Projeto único (`client/`, único workspace do repositório — ver `plan.md` § Project Structure).

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em `index.ts`/`index.html`
(arquivos compartilhados por toda a apresentação do jogo).

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova é necessária — `plan.md` §
  Technical Context, `research.md` Decisão 6)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: A configuração de escala é o único mecanismo de implementação desta feature
(`research.md`, Decisões 1–5) e bloqueia as três user stories — nenhuma delas é testável sem o
canvas já escalando. Não há trabalho de código específico por story: cada story (Fases 3–5) é
validação sobre este mesmo resultado.

**🚨 CRITICAL**: Nenhuma validação de user story pode começar até esta fase estar completa.

- [X] T002 [P] Em `client/index.ts`, adicionar o bloco `scale` à configuração do `Phaser.Game`
  (junto de `type`, `parent`, `width`, `height`, `backgroundColor`, `scene` já existentes):
  `mode: Phaser.Scale.FIT`, `autoCenter: Phaser.Scale.CENTER_BOTH`,
  `min: { width: 320, height: 200 }`. **Não** definir `max` (sem teto de ampliação — clarificação de
  2026-09-14, `research.md` Decisão 5, `data-model.md` tabela de configuração). `width`/`height`
  no nível raiz do config permanecem `GAME_WIDTH`/`GAME_HEIGHT` (960/600), inalterados.
- [X] T003 [P] Em `client/index.html`, ajustar o `<style>`: `html, body` passam a ocupar `width:
  100%; height: 100%` (em vez de `min-height: 100vh` com `display: flex; justify-content: center;
  align-items: center`, que assume o tamanho intrínseco do canvas); adicionar `overflow-x: auto` ao
  `body` para permitir rolagem horizontal quando o canvas atingir o `min` de 320px de largura
  (`research.md` Decisão 5); `#game` passa a ter `width: 100%; height: 100%; background: #0d0d0d`
  (cor de letterbox, mesma já usada em `backgroundColor` do `Phaser.Game` — `data-model.md`, diagrama
  DOM). Manter a declaração `@font-face` existente inalterada.

**Checkpoint**: `bun run dev` deve mostrar o canvas escalando ao redimensionar a janela, centralizado,
com borda `#0d0d0d` quando a proporção do viewport for diferente de 960:600 — pronto para validar
cada user story.

---

## Phase 2b: Base portrait dedicada (revisão pós-teste manual, 2026-09-15)

**Purpose**: T002/T003 (Foundational original) satisfaziam FR-001/FR-002 tecnicamente (sem
distorcer/cortar), mas testar manualmente em emulação de celular (390×844) mostrou que a proporção
única 960:600 deixava o campo de jogo como uma faixa fina (~28% da altura) em retrato — contra o
objetivo real do pedido ("compatível com celular sem precisar girar a tela"). Esta fase adiciona a
segunda base de layout (`spec.md` Clarifications; `research.md` Decisão 1b). Bloqueia a validação
"correta" de US1/US2 em retrato (T004/T005/T009/T010 abaixo agora devem ser lidas também à luz desta
fase, não só da Fase 2).

- [X] T002b [P] Em `client/src/config/gameConfig.ts`: detectar orientação uma única vez no
  carregamento do módulo (`window.innerHeight > window.innerWidth`, com fallback landscape quando
  `window` não existe — `bun test`); `GAME_WIDTH`/`GAME_HEIGHT` passam a `480`/`960` em portrait
  (inalterados, `960`/`600`, em landscape); `SHELF_Y_POSITIONS`/`FOOD_SLOT_X_POSITIONS` passam a
  ser calculados por fração da base landscape original em vez de arrays de pixels fixos
  (`research.md`, Decisão 1b)
- [X] T003b [P] Em `client/index.ts`: `scale.min.height` deixa de ser o literal `200` fixo e passa a
  `Math.round((320 * GAME_HEIGHT) / GAME_WIDTH)`, para preservar a proporção-base ativa no piso de
  320px de largura (`research.md`, Decisão 5 revisada)
- [X] T003c [P] [US2] Em `client/src/config/gameConfig.ts`: adicionar `UI_SCALE = GAME_WIDTH / 960`;
  em `client/src/scenes/StartScene.ts` e `client/src/scenes/GameOverScene.ts`, multiplicar todo
  `fontSize`/`padding` fixo em px por `UI_SCALE` (`Math.round`) — corrige corte de texto do título e
  da mensagem de derrota na base portrait, achado durante a validação manual desta fase
  (`research.md`, Decisão 4 revisada)

**Checkpoint**: `bun run dev`, recarregar a página em emulação de celular em retrato (não apenas
redimensionar uma janela já aberta — a escolha de base só é lida no carregamento) e confirmar que o
campo de jogo ocupa a maior parte da altura da tela, com `StartScene`/`GameScene`/`GameOverScene`
totalmente legíveis, sem texto cortado.

---

## Phase 3: User Story 1 - Jogar em tela pequena sem cortes (Priority: P1) 🎯 MVP

**Goal**: O campo de jogo inteiro (prateleiras, comidas, área de baratas) permanece visível e sem
distorção em qualquer viewport de 320px até desktop grande/ultrawide, inclusive durante
redimensionamento/rotação com uma partida em andamento.

**Independent Test**: reduzir a janela do navegador (ou emulação de dispositivo do DevTools) para
larguras típicas de celular/tablet e verificar que prateleiras, comidas e área de jogo continuam
100% visíveis e com as proporções originais preservadas (spec.md, User Story 1).

### Implementation for User Story 1

Nenhuma — implementada integralmente na Fase 2 (Foundational). Esta fase é de validação.

### Validação para User Story 1

- [X] T004 [US1] Validar Acceptance Scenario 1 (spec.md): com o jogo em `client/` via `bun run dev`,
  redimensionar a janela de 1920px para 375px de largura e confirmar que o campo de jogo inteiro
  continua visível, sem cortes nem barra de rolagem horizontal/vertical (`quickstart.md` passo 2.1,
  1º bullet). Validado nesta sessão (Edge) — ver também T004b (base portrait dedicada)
- [X] T004b [US1] Validar `quickstart.md` passo 9 (Phase 2b): **recarregar** (não só redimensionar)
  em emulação de celular em retrato (390×844) e confirmar que o campo de jogo usa a maior parte da
  altura da tela, não uma faixa fina central. Validado nesta sessão (Edge): ~89% da altura em uso
  (canvas 375×750 de 390×844 disponíveis), vs. ~28% antes da Phase 2b
- [ ] T005 [US1] Validar Acceptance Scenario 2 (spec.md): emular um tablet em retrato (ex.
  768×1024) no DevTools e confirmar que o espaço excedente aparece como borda neutra `#0d0d0d`
  (letterbox/pillarbox) sem esticar nem cortar o conteúdo (`quickstart.md` passo 2.1, 2º bullet).
  **Pendente** — só a proporção de celular comum (390×844) foi validada nesta sessão, não uma
  proporção de tablet
- [ ] T006 [US1] Validar Acceptance Scenario 3 (spec.md) e SC-004: iniciar uma partida, redimensionar
  a janela (e/ou girar a orientação na emulação) no meio do jogo, e confirmar que a partida continua
  rodando (baratas se movendo, HUD atualizando) sem reiniciar ou travar (`quickstart.md` passo 2.1,
  3º bullet). **Pendente** — não testado nesta sessão
- [ ] T007 [US1] Validar FR-006 (degradação <320px): encolher a janela manualmente para menos de
  320px e confirmar que o canvas trava no tamanho mínimo e uma barra de rolagem horizontal do
  navegador aparece, sem corte abrupto de conteúdo (`quickstart.md` passo 5). **Pendente** — não
  testado nesta sessão
- [ ] T008 [US1] Validar FR-005/FR-008/SC-005 (Princípio V): em ~375px de largura, clicar em baratas
  em movimento normalmente e também **imediatamente após redimensionar a janela** com uma barata em
  voo, confirmando que a precisão de clique se mantém igual à de desktop em ambos os casos
  (`quickstart.md` passo 4). Clique normal em baratas foi exercitado nesta sessão (portrait, Edge);
  o caso específico "clicar logo após redimensionar" **não** foi testado — mantido pendente

**Checkpoint**: User Story 1 validada de forma independente — o jogo é jogável sem cortes em
qualquer viewport suportado.

---

## Phase 4: User Story 2 - HUD legível em telas estreitas (Priority: P2)

**Goal**: Todos os elementos de HUD (vida, pontuação, risco) permanecem legíveis e sem sobreposição
em qualquer viewport suportado, escalando proporcionalmente ao canvas (Clarifications, sessão
2026-09-14).

**Independent Test**: reduzir a largura da janela até o limite mínimo suportado e verificar
visualmente que nenhum texto da HUD é cortado e que não há sobreposição entre vida, pontuação e
risco (spec.md, User Story 2).

### Implementation for User Story 2

Nenhuma — a escala proporcional da HUD é consequência direta da Fase 2 (Foundational), já que todo
o HUD é desenhado no mesmo espaço lógico escalado pelo `Scale Manager` (`research.md` Decisão 3,
FR-003). Esta fase é de validação.

### Validação para User Story 2

- [ ] T009 [US2] Validar Acceptance Scenario 1 (spec.md) e SC-003: com o canvas na largura mínima
  suportada (~320px), confirmar que o contador de comidas restantes, a barra de risco e a
  pontuação permanecem completamente legíveis (sem corte de caracteres) e sem se sobrepor entre si
  nem às prateleiras (`quickstart.md` passo 2.2, 1º bullet). **Parcial**: validado nesta sessão na
  largura portrait de 480px lógicos (vida/barra no canto superior direito, score à esquerda — ver
  também o ajuste de HUD desta sessão, fora do escopo desta spec), mas **não** no piso exato de
  320px — mantido pendente
- [ ] T010 [US2] Validar Acceptance Scenario 2 (spec.md): nessa mesma largura mínima, deixar uma
  comida ser roubada e eliminar uma barata, confirmando que os valores de HUD atualizam e
  continuam visíveis na mesma posição relativa (`quickstart.md` passo 2.2, 2º bullet). **Parcial**:
  validado a 480px lógicos nesta sessão (comida roubada, barra de vida atualizando), não a 320px —
  mantido pendente

**Checkpoint**: User Stories 1 e 2 validadas — jogo jogável e HUD legível em qualquer viewport
suportado.

---

## Phase 5: User Story 3 - Compatibilidade entre navegadores e resoluções comuns (Priority: P3)

**Goal**: O comportamento visual (layout, escala, legibilidade da HUD) é equivalente em Chrome,
Firefox e Edge para a mesma resolução testada.

**Independent Test**: abrir o jogo nos três navegadores-alvo nas mesmas resoluções de teste e
comparar que o campo de jogo e a HUD aparecem de forma equivalente em todos (spec.md, User Story 3).

### Implementation for User Story 3

Nenhuma — o `Scale Manager` é uma API nativa do Phaser (não específica de motor de navegador); a
compatibilidade é consequência da Fase 2 (Foundational). Esta fase é de validação.

### Validação para User Story 3

- [ ] T011 [US3] Validar Acceptance Scenario 1 (spec.md) e SC-006: repetir as mesmas larguras de
  teste (~375px e proporção de tablet em retrato, T004/T005) em Chrome, Firefox e Edge, confirmando
  layout e proporções visualmente equivalentes nos três (`quickstart.md` passo 2.3). **Pendente** —
  só Microsoft Edge estava disponível no ambiente desta sessão (a máquina não tem Chrome instalado);
  Chrome e Firefox continuam sem validação manual

**Checkpoint**: As três user stories validadas de forma independente e em conjunto.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cobrir os edge cases da spec que não pertencem a uma única user story e confirmar
ausência de regressão antes de considerar a feature pronta.

- [X] T012 [P] Validar FR-007: repetir a checagem de "sem cortes" (T004/T005) na `StartScene` (antes
  de clicar "Iniciar") e na `GameOverScene` (após perder a partida) em `client/src/scenes/`
  (`quickstart.md` passo 6). Validado nesta sessão em retrato (480px lógicos): **encontrou** o
  título/mensagem cortados (bug real, ver Phase 2b/T003c) e confirmou a correção depois de aplicada
  — usado `window.__game` exposto temporariamente para forçar `GameOverScene` sem esperar uma
  partida inteira terminar (removido antes do commit)
- [ ] T013 [P] Validar edge case de zoom do navegador: com o jogo em execução, usar Ctrl +/- e
  confirmar que o layout se re-adapta como se o viewport tivesse mudado de tamanho (`quickstart.md`
  passo 7). **Pendente** — não testado nesta sessão
- [X] T014 [P] Validar edge case de retrato extremo (Clarifications, sessão 2026-09-14): emular uma
  proporção muito estreita e alta (ex. celular em retrato) e confirmar que **nenhum** aviso de "gire
  o dispositivo" é exibido — apenas o letterbox normal, sem elemento de UI novo (spec.md, Edge Cases;
  `quickstart.md` passo 8). Validado nesta sessão (390×844): nenhum aviso de rotação em nenhuma tela
- [ ] T015 [P] Verificar 60 FPS estável durante o redimensionamento com o painel de Performance do
  DevTools, confirmando que nenhum código de escala roda por frame (`plan.md` § Performance Goals,
  Princípio V). **Pendente** — não testado nesta sessão
- [X] T016 Rodar `bun test` completo em `client/` novamente e confirmar zero regressões na suíte de
  domínio (T001 já era a baseline; esta é a confirmação final). Reconfirmado nesta sessão após cada
  mudança (44/44 passando) e via `tsc --noEmit` (zero erros)
- [ ] T017 Rodar a validação manual completa de `specs/006-responsividade-mobile/quickstart.md` de
  ponta a ponta como conferência final antes de abrir o PR. **Parcial**: passos 1–2 (base portrait),
  6 (StartScene/GameOverScene) e 8 (retrato extremo) cobertos nesta sessão; passos 3 (paridade de
  navegadores), 4 (clique durante resize), 5 (<320px) e 7 (zoom) continuam pendentes — ver T005–T008,
  T011, T013, T015 acima

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende da conclusão do Setup — BLOQUEIA as três user stories (T002 e
  T003 são independentes entre si, arquivos diferentes, `[P]`)
- **Base portrait dedicada (Phase 2b)**: depende da Fase 2; adicionada em 2026-09-15 após a
  validação manual da Fase 2 expor o desperdício de tela em retrato — também bloqueia a validação
  "correta" de US1/US2 em retrato (T002b/T003b são independentes entre si; T003c depende de T002b
  existir para `UI_SCALE` fazer sentido)
- **User Stories (Phase 3–5)**: todas dependem da conclusão da Foundational; como não há código
  específico por story (tudo já implementado na Fase 2), as três podem ser validadas em paralelo ou
  na ordem de prioridade P1 → P2 → P3
- **Polish (Phase 6)**: depende de todas as user stories desejadas estarem validadas

### User Story Dependencies

- **User Story 1 (P1)**: pode começar após a Foundational (Phase 2) — sem dependência de outras
  stories
- **User Story 2 (P2)**: pode começar após a Foundational (Phase 2) — validação independente, ainda
  que dependa visualmente do canvas já escalar (US1) para fazer sentido testar (spec.md, "Why this
  priority")
- **User Story 3 (P3)**: pode começar após a Foundational (Phase 2) — validação de abrangência sobre
  o comportamento já validado em US1/US2

### Parallel Opportunities

- T002 e T003 (Foundational) podem rodar em paralelo — arquivos diferentes (`index.ts` vs
  `index.html`), sem dependência entre si
- Uma vez concluída a Foundational, T004–T008 (US1), T009–T010 (US2) e T011 (US3) podem ser
  validados em paralelo por pessoas diferentes, já que nenhum altera código
- T012–T015 (Polish) podem rodar em paralelo entre si

---

## Parallel Example: Foundational

```bash
# T002 e T003 tocam arquivos diferentes e não têm dependência entre si:
Task: "Adicionar bloco scale ao Phaser.Game em client/index.ts"
Task: "Ajustar CSS de html/body/#game em client/index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup (T001)
2. Completar Phase 2: Foundational (T002, T003) — CRÍTICO, é a implementação inteira da feature
3. Completar Phase 3: validar User Story 1 (T004–T008)
4. **PARAR e VALIDAR**: jogo jogável sem cortes em qualquer viewport de 320px+
5. Deploy/demo se pronto

### Incremental Delivery

1. Setup + Foundational → canvas escalando corretamente (base de tudo)
2. Validar User Story 1 → sem cortes/distorção (MVP!)
3. Validar User Story 2 → HUD legível
4. Validar User Story 3 → paridade entre navegadores
5. Polish → edge cases (StartScene/GameOverScene, zoom, retrato extremo, performance) + regressão

## Notes

- Esta feature foi implementada em duas fases: a Fase 2 (Foundational, configuração pura de
  `Phaser.Game`/CSS) e a Fase 2b, adicionada em 2026-09-15 depois que a validação manual da Fase 2
  expôs que uma única proporção-base landscape desperdiçava a maior parte da tela em retrato
  (`plan.md` Revisão; `research.md` Decisão 1b). A Fase 2b toca `gameConfig.ts`, `StartScene.ts` e
  `GameOverScene.ts` — mais do que a nota original deste arquivo previa.
- `[P]` tasks = arquivos diferentes, sem dependência
- `[Story]` mapeia a task para a user story correspondente, para rastreabilidade
- **Status da validação manual (atualizado 2026-09-15)**: executada via extensão Claude in Chrome
  (Microsoft Edge — único navegador disponível no ambiente desta sessão). Concluído: T004, T004b,
  T012, T014, T016. Parcial (validado a 480px portrait, não no piso exato de 320px): T009, T010.
  Ainda pendente: T005 (proporção de tablet), T006 (resize/rotação em partida em andamento), T007
  (degradação <320px), T008 (clique logo após resize), T011 (paridade Chrome/Firefox), T013 (zoom
  do navegador), T015 (perf/60 FPS), T017 (quickstart ponta a ponta). O código em si foi verificado
  via `bunx tsc --noEmit` (zero erros) e `bun test` (44/44) a cada mudança.
