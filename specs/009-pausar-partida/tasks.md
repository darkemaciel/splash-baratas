---

description: "Task list template for feature implementation"
---

# Tasks: Pausar Partida

**Input**: Design documents from `/specs/009-pausar-partida/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/pause-lifecycle.md,
quickstart.md

**Tests**: não incluídas — `plan.md` § Technical Context e `research.md` §7 decidem explicitamente
por validação manual via `quickstart.md`, já que esta feature não introduz nenhuma função pura nova
em `entities/`/`systems/` (nada para `bun test` cobrir automaticamente; consistente com o padrão já
usado para comportamento de `Scene`/Scene Manager do Phaser em `001`/`003`/`007`/`008`).

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/scenes/`, `client/index.ts` (ver `plan.md` → Project Structure). Um
único arquivo novo (`client/src/scenes/PauseOverlayScene.ts`); todo o restante é aditivo sobre
arquivos já existentes do MVP (`001-roach-fridge-clicker`).

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar no código.

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova é necessária — `plan.md` §
  Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Nenhuma tarefa fundacional separada é necessária nesta feature. Toda a implementação
nova (o mecanismo de pausar/retomar em si, incluindo a `PauseOverlayScene`) pertence à User Story 1;
User Story 2 e User Story 3 apenas validam/documentam esse mesmo código sob ângulos diferentes
(ausência de cliques vazando e clareza do indicador visual), sem exigir nenhuma infraestrutura
própria adicional. Ver seção "Dependencies & Execution Order" abaixo.

**Checkpoint**: nada a fazer aqui — User Story 1 pode começar imediatamente após o Setup.

---

## Phase 3: User Story 1 - Pausar e retomar sem perder progresso (Priority: P1) 🎯 MVP

**Goal**: Permitir pausar e retomar a partida através de um botão no HUD e do botão "Continuar" de
uma overlay dedicada, congelando completamente trajeto/spawn/roubo de baratas, tweens de
feedback/juice e o cronômetro, e retomando exatamente do ponto congelado (FR-001 a FR-010, FR-013).

**Independent Test**: iniciar uma partida, deixar avançar até haver progresso visível, pausar,
aguardar alguns segundos, retomar e confirmar que vida, comidas restantes, pontuação, cronômetro e a
posição/animação de cada barata são exatamente os mesmos de antes da pausa; repetir pausar/retomar
em sequência rápida e confirmar que o estado permanece consistente.

### Implementation for User Story 1

- [X] T002 [US1] Criar `client/src/scenes/PauseOverlayScene.ts`: nova `Phaser.Scene` (chave
  `"PauseOverlayScene"`) com retângulo semitransparente cobrindo a tela inteira
  (`this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1b1b1b, 0.85)` —
  mesmo padrão de `GameOverScene`), texto "Pausado" centralizado (`fontSize` escalado por
  `UI_SCALE`, cor `#ffffff`, mesmo padrão de `GameOverScene`), e um botão "Continuar"
  (`setInteractive({ useHandCursor: true })`, mesmo padrão visual/interativo dos botões de
  `StartScene`/`GameOverScene`) — data-model.md § "PauseOverlayScene"
- [X] T003 [US1] Registrar `PauseOverlayScene` no array `scene: [...]` de `client/index.ts` (junto
  ao import das demais Scenes) — depende de T002 (precisa da classe já exportada para importar)
- [X] T004 [US1] Em `client/src/scenes/GameScene.ts`, adicionar constantes de posição do botão de
  pausa no topo do arquivo (junto às demais constantes de HUD já existentes) e criar o botão em
  `create()`: um botão de texto (`this.add.text(...)` com `backgroundColor`, mesmo padrão visual dos
  botões de `StartScene`/`GameOverScene` — NÃO um ícone/asset gráfico novo, Princípio VI) no canto
  superior esquerdo do HUD (mesma faixa vertical do HUD de vida/pontuação, acima de
  `HUD_BAR_TOP_Y`, fora da área das prateleiras), `setInteractive({ useHandCursor: true })`
- [X] T005 [US1] Em `GameScene.ts`, implementar o handler `pointerdown` do botão de pausa criado em
  T004, na ordem exata de `contracts/pause-lifecycle.md` § "Gatilhos e transições": (1)
  `event.stopPropagation()` no listener (4º argumento do callback `pointerdown` de um GameObject
  interativo) — impede que o mesmo clique também dispare `handlePointerDown` como clique perdido
  (research.md §3); (2) `this.sound.pauseAll()`; (3) `this.scene.pause()`; (4)
  `this.scene.launch("PauseOverlayScene")` — depende de T002, T003, T004
- [X] T006 [US1] Em `PauseOverlayScene.ts` (T002), implementar o handler `pointerdown` do botão
  "Continuar" na ordem exata de `contracts/pause-lifecycle.md` § "Gatilhos e transições": (1)
  `this.sound.resumeAll()`; (2) `this.scene.resume("GameScene")`; (3) `this.scene.stop()` — depende
  de T002
- [X] T007 [US1] Em `GameScene.create()`, adicionar a guarda defensiva
  `this.scene.stop("PauseOverlayScene")` logo junto às demais guardas defensivas já existentes no
  início do método (ex.: `this.sound.stopByKey("sfx-fly")`) — research.md §5, previne uma overlay de
  pausa "pendurada" sobreviver a um restart de partida — depende de T003
- [X] T017 [US1] **Correção pós-teste manual (2026-09-17)**: `this.time.now` sozinho não congela o
  relógio lógico corretamente — para durante a pausa mas salta para o tempo real ao retomar
  (research.md §1a). Em `GameScene.ts`: adicionar campos `pausedAccumMs`/`pauseStartedAtWallClock`,
  resetá-los em `create()` (junto às demais guardas defensivas), escutar
  `Phaser.Scenes.Events.PAUSE`/`RESUME` em `this.events` para acumular `pausedAccumMs` via
  `performance.now()`, adicionar `logicalNow()` = `this.time.now - pausedAccumMs`, e substituir
  **todo** uso de `this.time.now` que alimenta o domínio (`update()`, `updateTimer()`,
  `syncRoachSprites()`, `handlePointerDown()`, criação inicial do `timerText`) por
  `this.logicalNow()` — depende de T005, T007
- [X] T018 [US1] Extrair a sequência de pausar de T005 para um método privado `triggerPause()` em
  `GameScene.ts` (reutilizável pelo botão e pelo atalho de teclado) e adicionar
  `this.input.keyboard?.on("keydown-P", () => this.triggerPause())` em `create()` (FR-014) —
  depende de T005
- [X] T019 [US1] Extrair a sequência de retomar de T006 para um método privado `resumeMatch()` em
  `PauseOverlayScene.ts` e adicionar `this.input.keyboard?.on("keydown-P", () => this.resumeMatch())`
  (FR-014) — depende de T006
- [ ] T008 [US1] Validar manualmente o cenário 1 (pausar/retomar sem perder progresso, incluindo
  pausar/retomar repetidamente em sequência rápida, e via tecla "P" além do botão), o cenário 5 (som
  ambiente para e retoma junto com a pausa) e o cenário 7 (pausar exatamente no limite de uma barata
  alcançar o alvo — nem roubo nem remoção acontecem enquanto pausado; e um ciclo pausar/retomar sem
  duração perceptível não produz nenhum efeito colateral) de
  `specs/009-pausar-partida/quickstart.md`, rodando `bun run dev` em `client/` — depende de T005,
  T006, T007, T017, T018, T019

**Checkpoint**: User Story 1 completa e testável de forma independente — pausar/retomar funcional
(botão e tecla "P"), com relógio corrigido para não saltar ao retomar, incluindo overlay "Pausado" +
"Continuar" (a base para User Story 3) já presente.

---

## Phase 4: User Story 2 - Cliques não têm efeito enquanto pausado (Priority: P2)

**Goal**: Garantir que nenhum clique realizado enquanto a partida está pausada tenha qualquer
efeito — nem eliminação de barata, nem clique perdido, nem quebra de combo (FR-007, FR-008).

**Independent Test**: pausar a partida com pelo menos uma barata visível, clicar repetidamente sobre
ela e sobre pontos vazios da tela, e confirmar que nada muda de estado até retomar.

### Implementation for User Story 2

- [X] T009 [US2] Em `GameScene.ts`, junto ao handler `pointerdown` do botão de pausa (T005),
  adicionar um comentário curto documentando o invariante: enquanto `GameScene` está pausada
  (`this.scene.pause()`), o próprio Scene Manager do Phaser desativa o Input Plugin dessa Scene —
  nenhum `pointerdown` chega a `handlePointerDown` até a partida ser retomada — referenciar
  `contracts/pause-lifecycle.md` § "Garantia de não-interferência no domínio" para proteger este
  ponto contra regressões futuras (depende de T005; nenhuma mudança de comportamento, apenas o
  comentário — o invariante já é garantido pelo próprio Phaser, não por código nosso)
- [ ] T010 [US2] Validar manualmente o cenário 2 (cliques repetidos sobre a barata congelada e sobre
  pontos vazios não eliminam nenhuma barata, não tocam som de acerto/erro, e não alteram
  pontuação/combo ao retomar) e o cenário 6 (o próprio clique que dispara a pausa, no meio de uma
  sequência de combo, não toca `sfx-miss` nem reinicia o combo — a validação específica do
  `event.stopPropagation()` de T005/T009) de `specs/009-pausar-partida/quickstart.md`, rodando
  `bun run dev` em `client/` — depende de T008

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente — pausa funcional e comprovadamente
sem vazamento de clique.

---

## Phase 5: User Story 3 - Saber visualmente que a partida está pausada (Priority: P3)

**Goal**: Confirmar que o indicador "Pausado" criado em User Story 1 aparece de forma clara e
imediata ao pausar, e desaparece imediatamente ao retomar (FR-012, SC-003).

**Independent Test**: pausar a partida e, sem nenhuma outra interação, observar a tela — confirmar
que existe uma indicação visual inequívoca de pausa, removida imediatamente ao retomar.

### Implementation for User Story 3

- [X] T011 [US3] Revisar o texto "Pausado" criado em T002 e confirmar que segue o mesmo padrão de
  legibilidade/contraste já usado em `GameOverScene` (`fontSize` escalado por `UI_SCALE`, cor de
  alto contraste sobre o retângulo escurecido) — nota de design/checagem, sem exigir mudança de
  código se T002 já estiver conforme (depende de T002)
- [ ] T012 [US3] Validar manualmente o cenário 3 de `specs/009-pausar-partida/quickstart.md`
  (indicador "Pausado" aparece imediatamente ao pausar e desaparece imediatamente ao retomar)
  rodando `bun run dev` em `client/` — depende de T011

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto — pausa completa,
sem vazamento de clique, com indicação visual clara.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta, incluindo o edge case de
disponibilidade do controle de pausa (FR-011), que não pertence a nenhuma user story específica.

- [ ] T013 Validar manualmente o cenário 4 de `specs/009-pausar-partida/quickstart.md` (nenhum
  controle de pausa disponível na tela inicial nem na tela de derrota — FR-011, satisfeito por
  construção já que o botão de pausa só é criado em `GameScene.create()`, nunca em
  `StartScene`/`GameOverScene`) rodando `bun run dev` em `client/`
- [X] T014 Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte existente
  (nenhum teste novo é esperado — esta feature não adiciona funções puras a `entities/`/`systems/`)
- [X] T015 [P] Rodar `tsc --noEmit` e `bun run build` em `client/` e confirmar zero erros de
  compilação/build
- [ ] T016 Rodar a validação manual completa de `specs/009-pausar-partida/quickstart.md` (todos os
  cenários) como conferência final de ponta a ponta

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: vazia — não bloqueia nada além do próprio Setup
- **User Story 1 (Phase 3)**: depende de Setup — é o MVP; toda a implementação nova da feature vive
  aqui
- **User Story 2 (Phase 4)**: depende de User Story 1 (T005) já existir — não há nada para validar
  ou documentar sem o botão de pausa presente
- **User Story 3 (Phase 5)**: depende de User Story 1 (T002) já existir — não há indicador nenhum
  para validar sem a `PauseOverlayScene`
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Setup — nenhuma dependência de outra story
- **User Story 2 (P2)**: depende do código produzido pela User Story 1 (não é uma implementação
  independente — é uma garantia/documentação sobre o mesmo código), mas é independentemente
  **testável**: dá para confirmar a ausência de cliques vazando assim que US1 estiver pronta
- **User Story 3 (P3)**: depende do código produzido pela User Story 1 (o texto "Pausado" já nasce
  junto com a `PauseOverlayScene` em T002); independentemente **testável** em relação a US2 (mede um
  aspecto diferente — clareza visual, não ausência de efeito de clique)

### Within Each User Story

- `PauseOverlayScene` (T002) antes de ser registrada em `index.ts` (T003) e antes de seu próprio
  handler de "Continuar" (T006)
- Botão de pausa criado (T004) antes de seu handler `pointerdown` (T005)
- `PauseOverlayScene` registrada (T003) e botão de pausa criado (T004) antes do handler que os
  conecta (T005)
- Implementação antes da validação manual em cada story (T005/T006/T007 → T008; T009 → T010; T011 →
  T012)

### Parallel Opportunities

- T002 (criar `PauseOverlayScene.ts`) e T004 (criar o botão de pausa em `GameScene.ts`) podem ser
  implementados em paralelo — arquivos diferentes, nenhum depende do outro para existir
- Na Phase 6, T015 (`tsc`/build) pode rodar em paralelo com a validação manual T013/T016
- Fora esses casos, as tarefas de implementação formam uma cadeia majoritariamente sequencial (T005
  e T006 dependem de T002/T003/T004 já existirem antes de conectá-los)

---

## Parallel Example: User Story 1

```bash
# T002 e T004 podem ser implementados em paralelo (arquivos diferentes, sem dependência mútua):
Task: "Criar PauseOverlayScene (retângulo + texto Pausado + botão Continuar) em client/src/scenes/PauseOverlayScene.ts"
Task: "Criar o botão de pausa no HUD de client/src/scenes/GameScene.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 3: User Story 1 (Phase 2 não tem tarefas)
3. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T008)
4. Neste ponto já existe o item P1 do backlog ("Pausar partida") funcional — pausar/retomar sem
   perder progresso, já com overlay "Pausado" + "Continuar"

### Incremental Delivery

1. Setup → ponto de partida confirmado
2. User Story 1 → testar independentemente → mecanismo de pausa completo e funcional
3. User Story 2 → testar independentemente → ausência de cliques vazando confirmada
4. User Story 3 → testar independentemente → clareza do indicador visual confirmada
5. Polish → disponibilidade do controle (FR-011), regressão de testes, build limpo, validação de
   ponta a ponta

---

## Notes

- [P] = tarefas sem dependência de arquivo/lógica entre si — usado aqui em T002/T004 (Phase 3) e
  T015 (Phase 6)
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Nenhuma tarefa de teste automatizado é gerada — decisão documentada em `plan.md` § Technical
  Context e `research.md` §7 (sem função pura nova; Phaser `Scene`/Scene Manager não têm harness de
  teste automatizado neste projeto)
- FR-011 (controle de pausa indisponível fora de uma partida em andamento) é satisfeito por
  construção, sem tarefa de implementação dedicada — o botão de pausa só é criado dentro de
  `GameScene.create()` (T004), nunca em `StartScene`/`GameOverScene`; validado explicitamente no
  cenário 4 do quickstart em T013 (Polish), já que não pertence a nenhuma user story específica
- O texto "Pausado" (FR-012, base de User Story 3) nasce já em T002 (User Story 1), porque é parte
  do mesmo pequeno arquivo `PauseOverlayScene.ts` que o botão "Continuar" — User Story 3 é
  deliberadamente validação/revisão (T011/T012), não implementação do zero, seguindo o mesmo
  critério já usado em `specs/008-juice-animacao-barata` para requisitos satisfeitos por construção
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
