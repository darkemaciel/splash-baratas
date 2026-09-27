---

description: "Task list template for feature implementation"
---

# Tasks: Cursor Animado da Pata do Gato

**Input**: Design documents from `/specs/015-cursor-pata-animada/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/cursor-scene.md, quickstart.md

**Tests**: nenhum teste automatizado é gerado nesta feature — ela vive inteiramente em
`scenes/CursorScene.ts` e em alterações pontuais de outras Scenes (Phaser), sem nenhuma lógica pura
extraível para `entities/`/`systems/` (diferente de `AudioPreferenceStore`/`HighScoreStore`). Mesmo
padrão de `PauseOverlayScene`/`AudioControlScene`: validada via `quickstart.md` (`plan.md` §
Technical Context).

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/scenes/`, `client/src/config/`, `client/index.ts`, `client/index.html`
(ver `plan.md` → Project Structure). Um arquivo novo de produção
(`client/src/scenes/CursorScene.ts`) e alterações pontuais em `client/index.html`, `client/index.ts`,
`client/src/config/gameConfig.ts`, `client/src/scenes/BootScene.ts`,
`client/src/scenes/AudioControlScene.ts` e `client/src/scenes/GameScene.ts`; todo o restante é
aditivo sobre o MVP (`001-roach-fridge-clicker`) e as features já entregues.

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar no código.

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova é necessária — `plan.md` §
  Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestrutura mínima sem a qual nem a animação idle (US1) nem o golpe (US2) podem ser
observados — a Scene precisa existir, estar registrada, ser lançada, ter seu asset carregado e o
cursor nativo precisa estar escondido.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T002 [P] Adicionar a regra `#game.cursor-paw-ready canvas { cursor: none !important; }`
  (com o seletor **condicionado à classe** `cursor-paw-ready`, nunca `#game canvas` puro) ao
  `<style>` de `client/index.html` — sem ela, o cursor nativo reaparece ao passar sobre qualquer
  botão com `useHandCursor: true` (`StartScene`, `GameOverScene`, `PauseOverlayScene`,
  `AudioControlScene`), já que o Phaser escreve `canvas.style.cursor = 'pointer'` inline nesses
  hovers e só uma regra CSS com `!important` vence esse inline style (research.md §1, FR-001); a
  classe só é aplicada ao elemento `#game` quando o asset da pata carrega com sucesso (T006) — se o
  carregamento falhar, a classe nunca é adicionada e o cursor nativo do sistema permanece visível
  (FR-008)
- [X] T003 [P] Em `client/src/config/gameConfig.ts`, mover o valor hoje hardcoded em
  `client/src/scenes/AudioControlScene.ts` (`const AUDIO_BUTTON_FONT_SIZE_PX = 14`) e o padding
  vertical do botão de mute (`padding: { x: 10, y: 6 }`) para duas novas constantes exportadas
  (`AUDIO_BUTTON_FONT_SIZE_PX = 14`, `AUDIO_BUTTON_PADDING_Y_PX = 6`), e adicionar
  `SMALLEST_MENU_BUTTON_HEIGHT_PX = AUDIO_BUTTON_FONT_SIZE_PX + AUDIO_BUTTON_PADDING_Y_PX * 2` e
  `CURSOR_PAW_MAX_HEIGHT_PX = Math.round(SMALLEST_MENU_BUTTON_HEIGHT_PX * 0.5)` — a pata NÃO DEVE
  medir mais que `CURSOR_PAW_MAX_HEIGHT_PX` de altura (FR-001, SC-005, research.md §4); atualizar
  `AudioControlScene.ts` para importar **as duas** constantes de `gameConfig.ts` em vez de
  defini-las/hardcodá-las localmente — `AUDIO_BUTTON_FONT_SIZE_PX` no `fontSize` do botão E
  `AUDIO_BUTTON_PADDING_Y_PX` no `y` do objeto `padding: { x: 10, y: ... }` — mantendo o botão de
  mute com a mesma aparência de hoje e eliminando o literal `6` duplicado — **[Revisado, ver Notes]:
  `SMALLEST_MENU_BUTTON_HEIGHT_PX`/`CURSOR_PAW_MAX_HEIGHT_PX` foram removidas após feedback de
  playtest; `AUDIO_BUTTON_FONT_SIZE_PX`/`AUDIO_BUTTON_PADDING_Y_PX` continuam existindo e em uso**
- [X] T004 [P] Criar `client/src/scenes/CursorScene.ts`: esqueleto de nova `Phaser.Scene` (chave
  `"CursorScene"`), com `preload()`/`create()`/`update()` vazios por enquanto — base para as
  tarefas de US1/US2 a seguir
- [X] T005 Registrar `CursorScene` no array `scene: [...]` de `client/index.ts` como a **última**
  entrada (depois de `AudioControlScene`, junto ao import das demais Scenes) — a posição no array
  define a ordem de renderização/prioridade de input do Phaser, garantindo que a pata renderize e
  receba `pointermove` por cima de todas as outras Scenes (contracts/cursor-scene.md § "Ciclo de
  vida") — depende de T004
- [X] T006 [P] Em `client/src/scenes/BootScene.ts` `preload()`, adicionar
  `this.load.image("cursor-paw", "assets/sprites/paw.png")` (**revisado**: era `paw.jpg`, ver
  Notes) — primeira imagem de fato carregada de
  `client/public/assets/sprites/` pelo jogo (as texturas atuais de barata/comida/prateleira/fundo
  são geradas em runtime por `generatePlaceholderTextures()`, nunca carregadas de arquivo) —
  research.md §5; logo em seguida, registrar
  `this.load.once("filecomplete-image-cursor-paw", () =>
  document.getElementById("game")?.classList.add("cursor-paw-ready"))` — a classe (consumida pelo
  CSS de T002) só é adicionada quando o carregamento tem sucesso; se o arquivo falhar (evento
  `loaderror` do Phaser), a classe nunca é adicionada e nenhum código adicional é necessário para o
  fallback — o cursor nativo simplesmente permanece visível (FR-008, degradação graciosa)
- [X] T007 Em `client/src/scenes/BootScene.ts` `create()`, adicionar
  `this.scene.launch("CursorScene")` junto ao `this.scene.launch("AudioControlScene")` já
  existente — é a única forma de `CursorScene` efetivamente iniciar, já que apenas constar no array
  `scene: [...]` não a ativa (contracts/cursor-scene.md § "Chamadores") — depende de T004, T005;
  mesmo arquivo de T006 — aplicar em sequência para evitar conflito de diff

**Checkpoint**: Fundação pronta — `CursorScene` existe, registrada e lançada; asset da pata
carregado; cursor nativo escondido em toda a janela; tamanho máximo da pata definido. User stories
podem começar.

---

## Phase 3: User Story 1 - Cursor com a pata do gato substitui o ponteiro padrão (Priority: P1) 🎯 MVP

**Goal**: A pata do gato substitui o cursor padrão do sistema em toda a janela do jogo, seguindo o
ponteiro em tempo real e exibindo uma animação idle contínua (FR-001, FR-002, FR-003).

**Independent Test**: abrir o jogo, mover o ponteiro sobre a área do jogo e confirmar que o cursor
padrão do sistema desaparece, dando lugar à imagem da pata, que acompanha o movimento do mouse sem
atraso perceptível e exibe um movimento contínuo sutil (não fica estática).

### Implementation for User Story 1

- [X] T008 [US1] No início de `CursorScene.create()`, adicionar o guard
  `if (!this.textures.exists("cursor-paw")) { return; }` — se o asset falhou ao carregar (T006),
  `create()` não faz mais nada: nenhum sprite, listener ou animação é configurado, e o cursor
  nativo do sistema permanece visível (a classe CSS de T002 também nunca foi aplicada nesse caso) —
  FR-008. Esse guard envolve toda a lógica de `create()` desta Scene, incluindo o que as tarefas
  T009, T011 e T015 adicionam depois. Passado o guard, criar o sprite da pata usando a textura
  `"cursor-paw"`, redimensionado para `CURSOR_PAW_HEIGHT_PX` de altura (T003, **revisado**: era
  `CURSOR_PAW_MAX_HEIGHT_PX`, ver Notes) preservando a proporção original da imagem, posicionado
  inicialmente no centro da tela
  (`GAME_WIDTH / 2, GAME_HEIGHT / 2`) — depende de T002, T003, T004, T005, T006, T007
- [X] T009 [US1] Em `CursorScene.create()`, registrar `this.input.on("pointermove", (pointer) =>
  ...)` armazenando a última posição conhecida do ponteiro (`pointer.x`, `pointer.y`) em campo de
  instância — cada Scene ativa tem seu próprio Input Plugin, recebendo `pointermove` independente
  de outras Scenes (research.md §2) — depende de T008
- [X] T010 [US1] Em `CursorScene.update()`, reposicionar o sprite da pata (T008) na última posição
  conhecida (T009) a cada frame, sem nenhuma lógica adicional que possa atrasar a atualização
  (FR-002, SC-001) — depende de T009
- [X] T011 [US1] Em `CursorScene.update()`, quando `animationState` não for `"strike"`, calcular a
  direção do movimento do ponteiro desde o frame anterior e inclinar o sprite levemente nessa
  direção, suavizado por frame; sem movimento, o ângulo relaxa de volta a 0° (FR-003, data-model.md,
  research.md §6) — **revisado em 2026-09-26 a pedido do usuário**: era um balanço automático
  contínuo (`this.tweens.add({ ..., yoyo: true, repeat: -1 })`) rodando mesmo com o ponteiro parado;
  substituído por uma inclinação reativa ao movimento real, pata parada em repouso — depende de T008
- [X] T012 [US1] Validar manualmente os cenários 1 a 4 e o cenário 10 de
  `specs/015-cursor-pata-animada/quickstart.md` (cursor substituído em toda a janela, pata
  acompanha o ponteiro sem atraso, animação idle nunca estática, cursor padrão volta a aparecer
  fora da janela, e a pata tem tamanho fixo e reconhecível como pata de gato — FR-001/SC-005,
  **revisado**, ver Notes — em ambas as orientações landscape/portrait de
  `specs/006-responsividade-mobile`) rodando `bun run dev` em `client/` — depende de T002, T003,
  T008, T010, T011

**Checkpoint**: User Story 1 completa e testável de forma independente — pata visível em toda a
janela, seguindo o ponteiro com animação idle contínua (ainda sem reação a cliques).

---

## Phase 4: User Story 2 - Animação de golpe ao clicar (Priority: P2)

**Goal**: A pata "bate" visualmente a cada clique dentro do campo de jogo ativo — acertando uma
barata ou não — sem disparar em cliques de botões de menu e sem atrasar o hit-testing existente
(FR-004, FR-005, FR-006, FR-007, FR-010, Clarifications).

**Independent Test**: com o cursor da pata ativo, clicar em uma barata na tela e, em outro
momento, clicar em um espaço vazio (sem nenhuma barata sob o cursor); confirmar que a animação de
golpe da pata é disparada em ambos os casos, imediatamente no momento do clique, e nunca ao clicar
em um botão de menu.

### Implementation for User Story 2

- [X] T013 [US2] Adicionar constante `CURSOR_STRIKE_DURATION_MS = 150` em
  `client/src/config/gameConfig.ts` — duração da animação de golpe antes de voltar a `"idle"`
  (data-model.md § transições, FR-006)
- [X] T014 [US2] Em `client/src/scenes/GameScene.ts`, ao final de `handlePointerDown` (depois do
  bloco `if (hit) { ... } else { ... }`, como última linha do método), adicionar
  `this.game.events.emit("cursor:strike")` — `this.game.events` é o `EventEmitter` global do
  Phaser, compartilhado por todas as Scenes; emitir só depois do hit-test já ter concluído garante
  que a pata nunca participa do caminho crítico do clique (FR-005, FR-010); como o botão de pausa
  já chama `event.stopPropagation()` antes de chegar a este método, cliques nele nunca emitem esse
  evento — resolvendo FR-004 sem lógica extra (contracts/cursor-scene.md, research.md §3) —
  depende de nada (arquivo já existe)
- [X] T015 [US2] Em `CursorScene.create()`, assinar `this.game.events.on("cursor:strike", () =>
  ...)` definindo `animationState = "strike"` e `strikeStartedAt = this.time.now` (data-model.md §
  transições) — depende de T008
- [X] T016 [US2] Em `CursorScene`, implementar a animação de golpe via transformação procedural
  sobre o mesmo sprite da pata (ex.: rotação/escala mais acentuada e breve que a idle, com retorno
  ao estado de repouso), disparada toda vez que `animationState` entra em `"strike"` — visualmente
  idêntica independentemente de o clique ter acertado uma barata ou não (FR-007, research.md §5) —
  depende de T015
- [X] T017 [US2] Em `CursorScene.update()`, quando `animationState === "strike"` e
  `CURSOR_STRIKE_DURATION_MS` (T013) já tiver decorrido desde `strikeStartedAt`, voltar
  `animationState` para `"idle"` (data-model.md § transições) — depende de T013, T015
- [X] T018 [US2] Em `CursorScene`, garantir que um novo `cursor:strike` recebido enquanto
  `animationState` já é `"strike"` reinicia `strikeStartedAt` imediatamente para `this.time.now`,
  sem enfileirar nem esperar a animação anterior terminar (FR-006) — depende de T015
- [X] T019 [US2] Validar manualmente os cenários 5 a 9 de
  `specs/015-cursor-pata-animada/quickstart.md` (golpe ao acertar barata, golpe em clique vazio,
  golpe NÃO dispara em botões de menu, cliques rápidos sucessivos reiniciam o golpe, golpe não
  atrasa o hit-testing) rodando `bun run dev` em `client/` — o cenário 10 (tamanho da pata) já é
  validado em T012, por ser um requisito de US1 (FR-001/SC-005), não de US2 — depende de T014,
  T016, T017, T018

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente e em conjunto — pata completa,
com idle contínuo e golpe reativo a cliques de jogo, sem afetar botões de menu nem o hit-testing.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta, incluindo aspectos que não
pertencem a nenhuma user story específica.

- [X] T020 [P] Validar manualmente o cenário 11 de `specs/015-cursor-pata-animada/quickstart.md`
  (pata continua ativa durante a pausa — segue o ponteiro e mantém o idle — mas nenhum clique
  aciona golpe com efeito de acerto/erro/roubo enquanto a partida estiver congelada; o botão
  "Continuar" da overlay de pausa continua clicável) rodando `bun run dev` em `client/` — Edge
  Cases (comportamento durante `specs/009-pausar-partida`)
- [X] T021 [P] Validar manualmente o cenário 12 de `specs/015-cursor-pata-animada/quickstart.md`
  (degradação graciosa: se o asset da pata falhar ao carregar, o cursor padrão do sistema volta a
  aparecer e cliques continuam funcionando normalmente) rodando `bun run dev` em `client/` — FR-008
- [ ] T022 [P] Validar manualmente o cenário 13 de `specs/015-cursor-pata-animada/quickstart.md`
  (sem efeito observável em dispositivos touch) — Assumptions da spec — **não testado** (sem
  hardware/emulação touch disponível na sessão); risco aceito como baixo, já que é comportamento
  nativo do navegador (ausência de cursor de sistema em touch), não lógica desta feature
- [X] T023 Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte existente
  (nenhum teste novo é esperado nesta feature — `plan.md` § Testing)
- [X] T024 [P] Rodar `tsc --noEmit` e `bun run build` em `client/` e confirmar zero erros de
  compilação/build
- [X] T025 Atualizar `backlog.md`: marcar a parte de "cursor customizado" do item "Cursor
  customizado + animação de locomoção da barata (andando/voando)" (seção 3, Acessibilidade e UX)
  como entregue via `specs/015-cursor-pata-animada`, descrevendo o que foi implementado (pata como
  cursor em toda a janela, inclinação reativa ao movimento do ponteiro, golpe no clique restrito ao
  campo de jogo) e deixando
  explícito que a locomoção da barata (andando/voando) permanece pendente para uma spec futura
  separada
- [X] T026 Rodar a validação manual completa de `specs/015-cursor-pata-animada/quickstart.md`
  como conferência final de ponta a ponta — **aceita pelo usuário** após teste manual direto em
  2026-09-26 ("testei aqui e ficou muito bom"), cobrindo os cenários 1-12; cenário 13 (touch)
  permanece não testado (T022)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende do Setup — BLOQUEIA as duas user stories
- **User Story 1 (Phase 3)**: depende da Foundational completa — é o MVP
- **User Story 2 (Phase 4)**: depende da Foundational completa e do sprite da pata já existir
  (T008, de US1) — mas é uma fatia de valor independente (o golpe reage a um evento próprio, não
  reusa nenhum código específico da animação idle de US1 além do sprite em si)
- **Polish (Phase 5)**: depende de ambas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas da Foundational — nenhuma dependência de US2
- **User Story 2 (P2)**: depende de US1 ter criado o sprite da pata (T008) para ter o que animar,
  mas é independentemente **testável**: dá para confirmar o golpe assim que US1 estiver pronta,
  sem revisitar a lógica de idle/posicionamento

### Within Each User Story

- Sprite criado (T008) antes de rastrear posição (T009), reposicionar por frame (T010) e animar
  idle (T011)
- Implementação antes da validação manual em cada story (T002/T003/T008/T010/T011 → T012;
  T014/T016/T017/T018 → T019)
- Em User Story 2: evento emitido por `GameScene` (T014) e assinatura em `CursorScene` (T015)
  antes da animação de golpe em si (T016); duração (T013) e assinatura (T015) antes da transição de
  volta a idle (T017); assinatura (T015) antes do reinício em cliques rápidos (T018)

### Parallel Opportunities

- Na Phase 2, T002, T003, T004 e T006 podem começar em paralelo (arquivos diferentes, sem
  dependência mútua) — T005 e T007 dependem de T004 (e T007 também de T005)
- Na Phase 5, T020, T021, T022 e T024 podem rodar em paralelo entre si (validações e build
  independentes)
- Fora esses casos, as tarefas de implementação formam uma cadeia majoritariamente sequencial
  dentro de `CursorScene.ts` (T008 → T009 → T010; T008 → T011; T015 → T016/T017/T018)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# T002, T003, T004 e T006 podem começar em paralelo (arquivos diferentes):
Task: "Adicionar regra CSS cursor:none em client/index.html"
Task: "Mover constantes de tamanho de botão para gameConfig.ts e atualizar AudioControlScene.ts"
Task: "Criar esqueleto de CursorScene.ts"
Task: "Carregar assets/sprites/paw.png em BootScene.preload()"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia as duas user stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T012)
5. Neste ponto já existe um cursor customizado funcional (pata seguindo o ponteiro com idle
   contínuo em toda a janela), ainda sem reação a cliques

### Incremental Delivery

1. Setup + Foundational → fundação pronta (Scene, registro, asset, CSS, tamanho máximo)
2. User Story 1 → testar independentemente → cursor da pata funcional (MVP)
3. User Story 2 → testar independentemente → golpe no clique confirmado, sem afetar menus nem o
   hit-testing
4. Polish → comportamento correto durante a pausa, degradação graciosa, ausência de efeito em
   touch, regressão de testes, build limpo, backlog atualizado, validação de ponta a ponta

---

## Notes

- [P] = tarefas sem dependência de arquivo/lógica entre si — usado em T002/T003/T004/T006 (Phase
  2) e T020/T021/T022/T024 (Phase 5)
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Nenhum teste automatizado é gerado (ver seção "Tests" no topo) — feature 100% em `scenes/`, sem
  lógica pura extraível, mesmo caso de `PauseOverlayScene`/`AudioControlScene`
- A Foundational Phase não está vazia aqui (diferente de `specs/014-mute-som-jogo`) porque, ao
  contrário do toggle de mute (que reaproveitava a Scene overlay e o `SoundManager` já existentes),
  esta feature precisa criar a Scene, registrá-la, lançá-la e carregar seu primeiro asset de imagem
  real antes de qualquer animação existir
- research.md §5 documenta a decisão de animar via transformação procedural (rotação/escala) sobre
  uma única textura estática (`paw.png`) em vez de esperar por spritesheets de idle/golpe
  dedicados — mesmo padrão do "juice" da barata em `specs/008-juice-animacao-barata`
- O guard de textura ausente (T008) envolve toda a lógica de `create()` de `CursorScene` — se
  `cursor-paw` não existir (falha de load em T006), nada do que T009/T011/T015 adicionam depois
  chega a rodar; combinado com a classe CSS condicional de T002 (só aplicada em `filecomplete`,
  T006), isso implementa a degradação graciosa de FR-008 sem precisar de um handler de `loaderror`
  dedicado — sucesso de load é a única condição que liga tanto o CSS quanto o sprite
- **Correção pós-`/speckit-analyze` (2026-09-26)**: T002 e T006 passam a usar uma classe CSS
  condicional (`cursor-paw-ready`) em vez de ocultar o cursor incondicionalmente, e T008 ganha um
  guard de textura ausente — antes, nada implementava a degradação graciosa exigida por FR-008
  (só havia uma tarefa de *validação*, T021, sem nada que a fizesse passar). T003 passa a exigir
  explicitamente a religação de `AUDIO_BUTTON_PADDING_Y_PX` em `AudioControlScene.ts`, não só da
  constante de fonte. O cenário 10 do quickstart (tamanho da pata, FR-001/SC-005 — requisito de
  US1) migrou de T019 (US2) para T012 (US1), corrigindo uma validação fora de fase. Um novo cenário
  11 (comportamento durante a pausa) foi adicionado ao `quickstart.md` e validado em um novo T020,
  deslocando as tarefas de Polish seguintes (antigo T020→T021, T021→T022, T022→T023, T023→T024,
  T024→T025, T025→T026)
- **Correção pós-feedback do usuário (2026-09-26, após validação manual em navegador)**: a
  referência original `paw.jpg` era JPEG sem canal alfa — o quadriculado de "fundo transparente"
  dos editores de imagem tinha virado pixels reais no arquivo, e a pata renderizava com um fundo
  cinza-xadrez visível no jogo. Reprocessada para `paw.png` (recortada + fundo tornado transparente
  de fato); `paw.jpg` removido do repositório. Além disso, a regra de tamanho original (FR-001/
  SC-005: `0.5 * altura do menor botão` ≈ 13px) resultava numa pata pequena demais para reconhecer
  a forma/garras — substituída por `CURSOR_PAW_HEIGHT_PX` fixo (56px, escalado por `UI_SCALE`),
  desacoplado de `AudioControlScene`. `SMALLEST_MENU_BUTTON_HEIGHT_PX`/`CURSOR_PAW_MAX_HEIGHT_PX`
  foram removidas de `gameConfig.ts`; `AUDIO_BUTTON_FONT_SIZE_PX`/`AUDIO_BUTTON_PADDING_Y_PX`
  continuam existindo (usadas só pelo botão de mute, sem relação com o cursor). Ver research.md §4
  e §5, e spec.md (Clarifications, FR-001, SC-005) para o registro completo da revisão.
- **Correção pós-feedback do usuário (2026-09-26, segunda rodada)**: o "idle" original (T011) era
  um balanço automático contínuo (`this.tweens.add({ angle: {from:-8,to:8}, yoyo:true, repeat:-1
  })`) rodando mesmo com o ponteiro parado. Substituído por uma inclinação reativa: pata parada em
  repouso (0°), inclinando levemente na direção real do movimento do ponteiro (qualquer direção,
  incluindo vertical) enquanto ele se move, calculada e suavizada a cada `update()` — sem tween
  contínuo. `CursorScene` perdeu o campo `idleTween` e o método `startIdleAnimation()`, ganhando
  `lastFrameX`/`lastFrameY` e `updateDirectionalLean()`. Ver research.md §6, spec.md (Clarifications,
  FR-003, Acceptance Scenarios de US1) e data-model.md para o registro completo.
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
