---

description: "Task list template for feature implementation"
---

# Tasks: Feedback Sonoro (SFX)

**Input**: Design documents from `/specs/003-feedback-sonoro-sfx/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/audio-triggers.md, quickstart.md

**Tests**: não incluídas — `plan.md` § Technical Context e `research.md` §7 decidem explicitamente
por validação manual via `quickstart.md`, já que esta feature não introduz nenhuma função pura
nova em `entities/`/`systems/` (nada para `bun test` cobrir automaticamente; consistente com o
padrão já usado para comportamento de `Scene`/`SoundManager` do Phaser em `001` e `002`).

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3, US4)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/`, `client/public/assets/audio/` (ver `plan.md` → Project Structure).
Nenhuma pasta nova é criada; os arquivos de áudio já existem (`client/public/assets/audio/`,
confirmado pelo usuário e por `research.md`/`data-model.md`). Todos os arquivos de código tocados
já existem no MVP (`001-roach-fridge-clicker`)/HUD (`002-hud-progresso-risco`), exceto nenhum
arquivo novo — esta feature é estritamente aditiva sobre `BootScene.ts` e `GameScene.ts`.

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em arquivos compartilhados
(`scenes/BootScene.ts`, `scenes/GameScene.ts`).

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova é necessária — `plan.md` §
  Technical Context confirma que `Phaser.Sound.SoundManager` já vem com `phaser@^4.2.1`) — 25/25
  passando
- [X] T002 [P] Confirmar que os 5 arquivos existem em `client/public/assets/audio/` (`hit.mp3`,
  `miss.mp3`, `fly.mp3`, `steal.mp3`, `walk.mp3`) e que nenhum outro arquivo de áudio está solto
  fora dessa pasta (Princípio VI) — confirmado

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Carregar os assets de áudio antes de qualquer user story poder tocá-los — nenhum som
pode ser reproduzido sem sua chave de preload existir.

**⚠️ CRITICAL**: Nenhuma user story pode começar antes desta fase estar completa.

- [X] T003 Adicionar o método `preload()` em `client/src/scenes/BootScene.ts`, carregando
  `this.load.audio("sfx-hit", "assets/audio/hit.mp3")`, `this.load.audio("sfx-miss",
  "assets/audio/miss.mp3")`, `this.load.audio("sfx-steal", "assets/audio/steal.mp3")` e
  `this.load.audio("sfx-fly", "assets/audio/fly.mp3")` — usando exatamente as chaves da tabela
  "Convenção de chaves de preload" de `contracts/audio-triggers.md`. **NÃO** incluir
  `this.load.audio("sfx-walk", ...)` nesta tarefa nem em nenhuma outra desta feature (FR-011,
  research.md §6)

**Checkpoint**: os 4 assets de áudio usados por esta feature já estão carregados antes de
`StartScene`/`GameScene` existirem — todas as user stories podem começar.

---

## Phase 3: User Story 1 - Ouvir confirmação sonora ao eliminar uma barata (Priority: P1) 🎯 MVP

**Goal**: Tocar `hit.mp3` no exato momento em que o jogador elimina uma barata por clique,
permitindo sobreposição quando duas eliminações ocorrem em rápida sucessão (FR-001, FR-009).

**Independent Test**: iniciar uma partida, clicar em uma barata ativa dentro do hitbox e confirmar
que o som de acerto toca junto da remoção visual da barata; eliminar duas baratas em cliques
rápidos e confirmar que os dois sons tocam sem cortar um ao outro.

### Implementation for User Story 1

- [X] T004 [US1] No listener já existente `matchStateManager.on("roach:eliminated", ...)` dentro de
  `create()` de `client/src/scenes/GameScene.ts` (que já chama `this.playRoachEliminated(roachId)`),
  adicionar `this.sound.play("sfx-hit")` — usar o atalho `play()` do `SoundManager` (nunca guardar e
  reutilizar uma instância), conforme `contracts/audio-triggers.md` § "Mapeamento evento → som", de
  modo que reproduções se sobreponham naturalmente (FR-009) (depende de T003)
- [X] T005 [US1] Validado manualmente pelo usuário — cenário 1 do
  `specs/003-feedback-sonoro-sfx/quickstart.md` (som de acerto imediato; dois acertos rápidos
  sobrepostos sem corte) confirmado rodando `bun run dev` em `client/`

**Checkpoint**: User Story 1 completa e testável de forma independente — som de acerto funcional.

---

## Phase 4: User Story 2 - Ouvir feedback diferenciado ao errar o clique (Priority: P1)

**Goal**: Tocar `miss.mp3` quando o jogador clica na tela de jogo sem acertar nenhuma barata,
nunca junto do som de acerto no mesmo clique (FR-002, FR-003).

**Independent Test**: clicar em um ponto sem nenhuma barata sob o ponteiro e confirmar que o som
de erro toca (e o de acerto não); clicar sobre uma barata ativa e confirmar que apenas o som de
acerto toca.

### Implementation for User Story 2

- [X] T006 [US2] Em `handlePointerDown` de `client/src/scenes/GameScene.ts`, no branch onde
  `pickTopmostHit(...)` retorna `undefined` (hoje esse branch não faz nada — `if (hit) { ... }` sem
  `else`), adicionar um `else` que chama `this.sound.play("sfx-miss")`, garantindo que o som de
  acerto (T004) e o de erro nunca disparem para o mesmo evento de clique (FR-003 — mutuamente
  exclusivos porque vêm do mesmo resultado de `hit`/`undefined`) (depende de T003)
- [X] T007 [US2] Validado manualmente pelo usuário — cenário 2 do
  `specs/003-feedback-sonoro-sfx/quickstart.md` (som de erro em clique vazio; exclusividade
  acerto/erro no mesmo clique) confirmado rodando `bun run dev` em `client/`

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente — par acerto/erro completo.

---

## Phase 5: User Story 3 - Ouvir a ameaça sonora das baratas em cena (Priority: P2)

**Goal**: Tocar `fly.mp3` em loop sempre que houver ao menos uma barata ativa em cena, parando
assim que não houver nenhuma — incluindo ao final da partida e sem resíduo entre partidas
(FR-005, FR-006, FR-007).

**Independent Test**: observar o som ambiente começar ao surgir a primeira barata; eliminar/deixar
roubar todas as baratas ativas e confirmar que o som para; deixar surgir uma nova barata e
confirmar que o som volta, sempre como uma única instância mesmo com múltiplas baratas ativas;
perder a partida com baratas ainda ativas e confirmar que o som para imediatamente na transição
para a tela de game over.

### Implementation for User Story 3

- [X] T008 [US3] Em `client/src/scenes/GameScene.ts`, adicionar o campo privado
  `private isFlyLoopActive = false;` e, no início de `create()` (antes de qualquer outra
  inicialização), chamar `this.sound.stopByKey("sfx-fly")` como guarda defensiva contra resíduo de
  loop de uma partida anterior (data-model.md § "Som ambiente (loop)"; edge case de reinício,
  FR-006) (depende de T003)
- [X] T009 [US3] Em `override update(...)` de `client/src/scenes/GameScene.ts`, após obter
  `snapshot` (reaproveitando a leitura já usada por `syncRoachSprites`), comparar
  `snapshot.activeRoaches.length > 0` com `this.isFlyLoopActive`: na transição de `false` para
  `true`, chamar `this.sound.play("sfx-fly", { loop: true })` e atualizar `this.isFlyLoopActive =
  true`; na transição de `true` para `false`, chamar `this.sound.stopByKey("sfx-fly")` e atualizar
  `this.isFlyLoopActive = false`; nenhuma outra transição dispara chamada alguma (FR-007 — nunca
  mais de uma instância audível) (depende de T008)
- [X] T010 [US3] No listener já existente `matchStateManager.on("match:lost", ...)` dentro de
  `create()` de `client/src/scenes/GameScene.ts` (que já chama
  `this.scene.start("GameOverScene")`), adicionar `this.sound.stopByKey("sfx-fly")` e
  `this.isFlyLoopActive = false` **antes** da chamada a `this.scene.start(...)` — obrigatório porque
  `this.sound` é o `SoundManager` do `Game` (nível global, não por-`Scene`: research.md §4) e o loop
  continuaria tocando após a troca de scene se não for parado explicitamente (depende de T008, T009)
- [X] T011 [US3] Validado manualmente pelo usuário — cenário 3 do
  `specs/003-feedback-sonoro-sfx/quickstart.md` (início/fim do loop ambiente, ausência de loops
  duplicados com múltiplas baratas, parada imediata no game over) confirmado rodando `bun run dev`
  em `client/`

**Checkpoint**: User Stories 1, 2 e 3 funcionam de forma independente — ameaça sonora contínua
completa.

---

## Phase 6: User Story 4 - Ouvir a barata roubando a comida-alvo (Priority: P2)

**Goal**: Tocar `steal.mp3` no exato momento em que uma barata alcança sua comida-alvo, permitindo
sobreposição quando dois roubos ocorrem em rápida sucessão (FR-004, FR-009).

**Independent Test**: deixar uma barata roubar sua comida-alvo sem clicar nela e confirmar que o
som de roubo toca junto do sumiço da comida; provocar dois roubos quase simultâneos e confirmar que
os dois sons tocam sem cortar um ao outro.

### Implementation for User Story 4

- [X] T012 [US4] No listener já existente `matchStateManager.on("food:stolen", ...)` dentro de
  `create()` de `client/src/scenes/GameScene.ts` (que já chama
  `this.playFoodStolen(foodItemId)`), adicionar `this.sound.play("sfx-steal")` — mesmo padrão de
  `play()` sem reutilizar instância usado em T004, permitindo sobreposição (FR-009) (depende de
  T003)
- [X] T013 [US4] Validado manualmente pelo usuário — cenário 4 do
  `specs/003-feedback-sonoro-sfx/quickstart.md` (som de roubo imediato; dois roubos rápidos
  sobrepostos sem corte) confirmado rodando `bun run dev` em `client/`

**Checkpoint**: as quatro user stories funcionam de forma independente e em conjunto — os quatro
gatilhos de SFX descritos no item de backlog estão completos.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta, incluindo os itens que não
pertencem a nenhuma user story isolada (reinício sem resíduo, `walk.mp3` fora de escopo,
performance).

- [X] T014 Validado manualmente pelo usuário — cenário 5 do
  `specs/003-feedback-sonoro-sfx/quickstart.md`
  (reinício após derrota sem nenhum som ambiente residual da partida anterior) confirmado rodando
  `bun run dev` em `client/`
- [X] T015 [P] Validar o cenário 6 do `specs/003-feedback-sonoro-sfx/quickstart.md` (`walk.mp3`
  nunca é requisitado — FR-011). Verificado estaticamente via `grep -rn "walk" client/src/` — a
  string `walk` só aparece em um comentário explicativo em `BootScene.ts`, nunca em
  `this.load.audio(...)` nem `this.sound.play(...)`; nenhuma chave `sfx-walk` existe no código.
  Extensão do Chrome não conectada nesta sessão para repetir a checagem ao vivo pelo painel de
  Network do DevTools — recomendo essa confirmação visual adicional na próxima sessão com o jogo
  aberto no navegador
- [X] T016 [P] Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte
  existente (nenhum teste novo é esperado — esta feature não adiciona funções puras a
  `entities/`/`systems/`) — 25/25 passando; adicionalmente rodado `tsc --noEmit` (0 erros) e
  `bun run build` (build de produção concluído com sucesso, incluindo os 4 assets de áudio
  copiados para `dist/assets/audio/`)
- [ ] T017 **Pendente (verificação formal opcional)** — o playtest manual do usuário não reportou
  nenhum atraso perceptível entre clique e remoção/eliminação da barata com os sons ativos (sinal
  informal de que SC-002 está OK), mas o painel de performance do navegador não foi aberto
  formalmente para confirmar 60 FPS estável. Nota de design: nenhum trabalho pesado novo por frame
  foi introduzido — `syncFlyLoop` (T009) é uma única comparação booleana por frame, e
  `sound.play()`/`stopByKey()` só são chamados nas transições de borda, nunca a cada frame. Não
  bloqueia o merge; pode ser revisitado se algum sintoma de performance surgir depois

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: depende de Setup — BLOQUEIA todas as user stories (nenhum som pode
  tocar sem preload)
- **User Story 1 (Phase 3)**: depende de Foundational (T003) — é o MVP
- **User Story 2 (Phase 4)**: depende de Foundational (T003) — independente de US1 no código
  (branches `if`/`else` distintos de `handlePointerDown`), mas edita o mesmo arquivo
- **User Story 3 (Phase 5)**: depende de Foundational (T003) — independente de US1/US2 no código
  (`update()` e o listener `match:lost`, não tocados por US1/US2)
- **User Story 4 (Phase 6)**: depende de Foundational (T003) — independente de US1/US2/US3 no
  código (listener `food:stolen`, não tocado pelas demais)
- **Polish (Phase 7)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Foundational — nenhuma dependência de outra story
- **User Story 2 (P1)**: depende apenas de Foundational — nenhuma dependência de outra story
- **User Story 3 (P2)**: depende apenas de Foundational — nenhuma dependência de outra story
- **User Story 4 (P2)**: depende apenas de Foundational — nenhuma dependência de outra story

Todas as quatro user stories tocam pontos diferentes do mesmo arquivo (`GameScene.ts`), mas nenhuma
lê ou escreve estado produzido por outra — são logicamente independentes entre si, apenas não
fisicamente paralelizáveis sem risco de conflito de edição no mesmo arquivo.

### Within Each User Story

- Preload (Foundational) antes de qualquer `play()` (T003 → T004/T006/T009/T012)
- Dentro da US3: campo/guarda defensiva antes da lógica de transição, antes do stop em
  `match:lost` (T008 → T009 → T010)
- Implementação antes da validação manual em cada story (T004→T005, T006→T007, T008-T010→T011,
  T012→T013)

### Parallel Opportunities

- T001 e T002 (Setup) podem rodar em paralelo
- Dentro de cada user story, as tarefas de implementação formam uma cadeia sequencial (mesmo
  arquivo `GameScene.ts`) — não há tarefas de implementação verdadeiramente paralelizáveis
- Na Phase 7, T015 e T016 podem rodar em paralelo entre si (verificações independentes, sem edição
  de arquivo)

---

## Parallel Example: Polish

```bash
# T015 (checagem de rede/DevTools) e T016 (suíte automatizada) podem rodar ao mesmo tempo:
Task: "Confirmar que walk.mp3 nunca é requisitado (DevTools Network)"
Task: "bun test (suíte completa em client/)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO — bloqueia todas as user stories)
3. Completar Phase 3: User Story 1
4. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T005)
5. Neste ponto já existe feedback sonoro de acerto — o evento mais frequente da partida

### Incremental Delivery

1. Setup + Foundational → assets de áudio carregados
2. User Story 1 → testar independentemente → som de acerto funcional
3. User Story 2 → testar independentemente → som de erro funcional (par acerto/erro completo)
4. User Story 3 → testar independentemente → ameaça sonora contínua (loop de voo)
5. User Story 4 → testar independentemente → som de roubo funcional
6. Polish → reinício sem resíduo, `walk.mp3` fora de escopo confirmado, regressão de testes,
   performance

### Parallel Team Strategy

Com múltiplos desenvolvedores, após Foundational (T003) completo, as quatro user stories podem ser
distribuídas entre pessoas diferentes — cada uma toca um listener/branch distinto de `GameScene.ts`
sem depender do resultado das outras — mas exigem coordenação de merge por editarem o mesmo
arquivo.

---

## Notes

- [P] = tarefas verdadeiramente sem dependência de arquivo entre si — usado aqui apenas em Setup
  (T001/T002) e Polish (T015/T016), já que as fases de user story editam sequencialmente o mesmo
  arquivo (`GameScene.ts`)
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Nenhuma tarefa de teste automatizado é gerada — decisão documentada em `plan.md` §
  Technical Context e `research.md` §7 (sem função pura nova; Phaser `Scene`/`SoundManager` não tem
  harness de teste automatizado neste projeto)
- **FR-011** (`walk.mp3` sem gatilho) não é uma tarefa de implementação — é a ausência
  deliberada de uma chamada em T003, validada explicitamente por T015
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
