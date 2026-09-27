---

description: "Task list template for feature implementation"
---

# Tasks: Animação de Locomoção da Barata (Andar/Voar)

**Input**: Design documents from `/specs/016-animacao-locomocao-barata/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md,
contracts/roach-locomotion.md, quickstart.md

**Tests**: não incluídas — `plan.md` § Technical Context decide explicitamente por validação
manual via `quickstart.md`, já que esta feature não introduz nenhuma função pura nova em
`entities/`/`systems/` (toda a implementação vive em `GameScene.ts`, um `Phaser.Scene` sem
harness de teste automatizado neste projeto — mesmo padrão de `specs/008-juice-animacao-barata`).

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/scenes/GameScene.ts` (ver `plan.md` → Project Structure). Nenhuma
pasta ou arquivo novo é criado; toda a mudança de código é aditiva sobre um único arquivo já
existente do MVP (`001-roach-fridge-clicker`), junto ao "juice" já entregue em
`specs/008-juice-animacao-barata`.

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em `GameScene.ts`.

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova é necessária — `plan.md` §
  Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Nenhuma tarefa fundacional é necessária nesta feature. Toda a implementação do
mecanismo de animação pertence à User Story 1; User Story 2 adiciona a variedade de estilos por
cima do mesmo mecanismo, sem exigir nenhuma infraestrutura própria adicional. Ver seção
"Dependencies & Execution Order" abaixo.

**Checkpoint**: nada a fazer aqui — User Story 1 pode começar imediatamente após o Setup.

---

## Phase 3: User Story 1 - Barata visivelmente animada durante todo o trajeto (Priority: P1) 🎯 MVP

**Goal**: Substituir o sprite estático da barata por uma animação de locomoção contínua (rotação
procedural via `angle`), ativa desde o primeiro frame e composta com o "juice" de urgência já
existente, parando no instante da eliminação e congelando durante a pausa (FR-001, FR-004, FR-005,
FR-006, FR-007).

**Independent Test**: iniciar uma partida, observar uma barata do spawn até o alvo, e confirmar que
ela nunca aparece como um sprite parado — a oscilação está sempre presente, inclusive quando o
"juice" de urgência (squash/tremor) também está ativo, e some no instante em que a barata é
eliminada.

### Implementation for User Story 1

- [X] T002 [US1] Em `client/src/scenes/GameScene.ts`, adicionar as constantes do efeito no topo do
  arquivo (junto às demais constantes de "juice" já existentes de `specs/008`):
  `FLY_LOCOMOTION_TILT_MAX_DEG = 6`, `FLY_LOCOMOTION_FREQUENCY_HZ = 6`,
  `WALK_LOCOMOTION_TILT_MAX_DEG = 10`, `WALK_LOCOMOTION_FREQUENCY_HZ = 2.2` — valores iniciais de
  tuning de `contracts/roach-locomotion.md` § "Entrada única do cálculo de ângulo" (ajustáveis
  depois, desde que a diferença entre os dois estilos continue perceptível — SC-002)
- [X] T003 [US1] Em `client/src/scenes/GameScene.ts`, implementar o método privado
  `computeRoachLocomotionAngle(roach: Roach, now: number, estilo: "andando" | "voando"): number`:
  para `estilo === "voando"`, `FLY_LOCOMOTION_TILT_MAX_DEG * Math.sin(now / 1000 *
  FLY_LOCOMOTION_FREQUENCY_HZ * 2 * Math.PI + this.roachPhase(roach.id))`; para
  `estilo === "andando"`, a mesma fórmula usando `WALK_LOCOMOTION_TILT_MAX_DEG`/
  `WALK_LOCOMOTION_FREQUENCY_HZ` — **sem** multiplicar por `progress(roach, now)` (amplitude
  constante desde o spawn, ao contrário do "juice" — FR-001, research.md §3/§4) (depende de T002;
  reutiliza `roachPhase(roachId)` já existente de `specs/008`, sem duplicar)
- [X] T004 [US1] Em `syncRoachSprites()` de `client/src/scenes/GameScene.ts`, logo após aplicar
  `sprite.setScale(squash.scaleX, squash.scaleY)` (já existente), chamar
  `computeRoachLocomotionAngle(roach, now, "voando")` (estilo fixo em `"voando"` por enquanto — a
  User Story 2 substitui esse literal pelo estilo sorteado por barata) e aplicar via
  `sprite.setAngle(...)`, em ambos os branches (criação e atualização) — canal isolado, nunca lido
  por `computeRoachSquashStretch`/`computeRoachTremorOffset` nem pelo hit-testing (FR-005,
  contracts/roach-locomotion.md § "Canal de transformação") (depende de T003)
- [X] T005 [US1] Validar manualmente os cenários 1, 2, 3 e 4 de
  `specs/016-animacao-locomocao-barata/quickstart.md` (nenhuma barata aparece parada; a locomoção
  continua visível por baixo do "juice" de urgência sem ser encoberta; a locomoção para no instante
  da eliminação, sem resíduo durante a queda; a locomoção também para no instante em que a barata
  rouba a comida, sem resíduo antes de desaparecer — FR-006) rodando `bun run dev` em `client/` —
  depende de T004

**Checkpoint**: User Story 1 completa e testável de forma independente — toda barata ativa exibe
locomoção contínua (um único estilo por enquanto), composta corretamente com o "juice" existente.

---

## Phase 4: User Story 2 - Dois estilos visuais de locomoção: andando e voando (Priority: P2)

**Goal**: Sortear um estilo de locomoção ("andando" ou "voando") por barata no momento em que ela é
criada, mantendo-o estável até o fim do trajeto, para que os dois estilos coexistam visivelmente na
mesma cena (FR-002, FR-003).

**Independent Test**: observar várias baratas ativas ao mesmo tempo e confirmar que pelo menos duas
delas exibem estilos de locomoção visualmente diferentes entre si, cada uma mantendo seu próprio
estilo do spawn até o fim do trajeto.

### Implementation for User Story 2

- [X] T006 [US2] Em `client/src/scenes/GameScene.ts`, adicionar o campo privado
  `roachLocomotionStyles = new Map<string, "andando" | "voando">()`, junto aos demais campos de
  estado já existentes (`roachSprites`, etc.) — data-model.md § "Estilo de Locomoção por Barata"
- [X] T007 [US2] Em `syncRoachSprites()` de `client/src/scenes/GameScene.ts`, no branch de criação
  do sprite (`if (!sprite) { ... }`), substituir o literal `"voando"` de T004: sortear
  `Math.random() < 0.5 ? "andando" : "voando"` **somente se** `this.roachLocomotionStyles` ainda não
  tiver uma entrada para `roach.id`, salvar no `Map`, e usar o valor lido do `Map` (nunca re-sortear)
  como terceiro argumento de `computeRoachLocomotionAngle` em ambos os branches (criação e
  atualização) — contracts/roach-locomotion.md § "Estilo de locomoção: sorteio e estabilidade"
  (depende de T004, T006)
- [X] T008 [US2] No loop de limpeza de `syncRoachSprites()` (o `for (const [id, sprite] of
  this.roachSprites)` que já chama `sprite.destroy()`/`this.roachSprites.delete(id)` para baratas
  fora de `activeIds`), adicionar `this.roachLocomotionStyles.delete(id)` — evita entradas órfãs no
  `Map` quando uma barata é eliminada, rouba a comida, ou a partida reinicia (depende de T006)
- [X] T009 [US2] Validar manualmente os cenários 5 e 6 de
  `specs/016-animacao-locomocao-barata/quickstart.md` (pelo menos dois estilos de locomoção
  coexistindo na mesma cena; o estilo de uma barata específica não muda do spawn ao fim do trajeto)
  rodando `bun run dev` em `client/` — depende de T007, T008

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente e em conjunto — locomoção
contínua completa, com dois estilos visualmente distintos coexistindo e estáveis por barata.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo garantias que já valem por construção (FR-005, FR-007) e
aspectos que não pertencem a nenhuma user story específica.

- [X] T010 [P] Validar manualmente o cenário 7 de
  `specs/016-animacao-locomocao-barata/quickstart.md` (a oscilação de locomoção congela durante a
  pausa e retoma de onde parou ao despausar, sem pular nem acelerar) rodando `bun run dev` em
  `client/` — FR-007, satisfeito por construção via `logicalNow()` (research.md §5)
- [X] T011 [P] Validar manualmente o cenário 8 de
  `specs/016-animacao-locomocao-barata/quickstart.md` (nenhum atraso perceptível entre o clique e a
  eliminação da barata, com a animação de locomoção ativa) rodando `bun run dev` em `client/` —
  FR-005, SC-003, Princípio V
- [X] T012 Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte existente
  (nenhum teste novo é esperado nesta feature — `plan.md` § Testing)
- [X] T013 [P] Rodar `tsc --noEmit` e `bun run build` em `client/` e confirmar zero erros de
  compilação/build
- [X] T014 Atualizar `backlog.md`: marcar o item "Animação de voo da barata" (seção 1) e a parte de
  locomoção do item "Cursor customizado + animação de locomoção da barata (andando/voando)" (seção
  3) como entregues via `specs/016-animacao-locomocao-barata`, descrevendo o que foi implementado
  (locomoção contínua com dois estilos sorteados por barata, composta com o "juice" existente)
- [X] T015 Rodar a validação manual completa de
  `specs/016-animacao-locomocao-barata/quickstart.md` (todos os 8 cenários) como conferência final
  de ponta a ponta

---

## Phase 6: Arte real de andar/voar (revisão de 2026-09-27, FR-008 a FR-010)

**Purpose**: validação no servidor dev mostrou que a barata continuava sendo a bolinha placeholder
(só girando) — substituída pelas animações por quadros extraídas de `docs/references/*.mp4`.

- [X] T016 Criar `docs/references/roach-animations/build_roach_spritesheets.py`: extrai os trechos
  que fecham loop (andar: quadros 10-62; voar: 58-88, de 2 em 2), remove fundo/marca d'água e gera
  `client/public/assets/sprites/roach-walk.png` (27 quadros) e `roach-fly.png` (16 quadros), 128x128
  cada, além dos quadros master 256x256 em `docs/references/roach-animations/frames/` — FR-008
- [X] T017 Em `client/src/scenes/BootScene.ts`, carregar os dois spritesheets, criar as animações
  em loop (`roach-walk` 15 fps, `roach-fly` 20 fps) e remover a textura placeholder `"roach"`
  (bolinha com "cabeça") — FR-008
- [X] T018 Em `client/src/scenes/GameScene.ts`, trocar `Image` por `Sprite`, tocar a animação do
  estilo sorteado a partir de um quadro aleatório, aplicar `ROACH_SPRITE_SCALE` (0.5 — corpo ~40px,
  igual à bolinha) multiplicado pelo squash/stretch, e orientar pelo trajeto (`applyRoachHeading`:
  spawn → alvo, espelhando para a esquerda), com a oscilação de `computeRoachLocomotionAngle` somada
  ao ângulo — FR-008, FR-009, FR-010
- [X] T019 Validar no `bun run dev`: baratas animadas desde o spawn, orientadas/espelhadas no
  trajeto, tamanho equivalente à bolinha, velocidade das animações aprovada pelo usuário para o MVP;
  `tsc --noEmit`, `bun test` (107 testes) e `bun run build` sem erros
- [X] T020 Registrar no `backlog.md` (seção 1) o card de aprimoramento das animações, apontando para
  `docs/references/roach-animations/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: vazia — não bloqueia nada além do próprio Setup
- **User Story 1 (Phase 3)**: depende de Setup — é o MVP; todo o mecanismo de animação vive aqui
  (com um único estilo fixo, `"voando"`, por enquanto)
- **User Story 2 (Phase 4)**: depende de User Story 1 (T004) já existir — substitui o estilo fixo
  pelo sorteio por barata; não há nada para sortear sem o mecanismo de T002-T004 já funcionando
- **Polish (Phase 5)**: depende de ambas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Setup — nenhuma dependência de US2
- **User Story 2 (P2)**: depende do código produzido pela User Story 1 (`computeRoachLocomotionAngle`
  e sua aplicação em `syncRoachSprites`), mas é uma fatia de valor independente e
  independentemente **testável**: US1 sozinha já entrega "nenhuma barata estática"; US2 adiciona a
  variedade visual por cima, sem precisar revisitar a fórmula em si

### Within Each User Story

- Constantes antes da fórmula que as usa (T002 → T003)
- Fórmula antes de ser aplicada em `syncRoachSprites` (T003 → T004)
- Implementação antes da validação manual em cada story (T004 → T005; T007/T008 → T009)
- Em User Story 2: campo do `Map` (T006) antes de ser lido/escrito (T007) e antes de ser limpo
  (T008); T007 depende também de T004 já existir (é o código que ele substitui)

### Parallel Opportunities

- Na Phase 5, T010, T011 e T013 podem rodar em paralelo entre si (validações e build
  independentes)
- Fora esse caso, as tarefas de implementação formam uma cadeia majoritariamente sequencial (mesmo
  arquivo `GameScene.ts`, e cada passo depende do anterior)

---

## Parallel Example: Phase 5 (Polish)

```bash
# T010, T011 e T013 podem rodar em paralelo (validações e build independentes):
Task: "Validar cenário 7 (pausa congela a locomoção) em specs/016-animacao-locomocao-barata/quickstart.md"
Task: "Validar cenário 8 (sem atraso no clique) em specs/016-animacao-locomocao-barata/quickstart.md"
Task: "Rodar tsc --noEmit e bun run build em client/"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 3: User Story 1 (Phase 2 não tem tarefas)
3. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T005)
4. Neste ponto já existe locomoção contínua funcional (um único estilo, `"voando"`, aplicado a
   todas as baratas) — nenhuma aparece mais como sprite estático

### Incremental Delivery

1. Setup → ponto de partida confirmado
2. User Story 1 → testar independentemente → locomoção contínua funcional (MVP)
3. User Story 2 → testar independentemente → dois estilos coexistindo, estáveis por barata
4. Polish → garantias de pausa/responsividade confirmadas, regressão de testes, build limpo,
   backlog atualizado, validação de ponta a ponta

---

## Notes

- **Revisão de 2026-09-27 (Phase 6)**: a marca de "cabeça" na textura placeholder, descrita no item
  abaixo, deixou de existir — a textura `"roach"` foi removida e substituída pelos spritesheets
  `roach-walk`/`roach-fly`.
- **Correção descoberta na validação manual (2026-09-26)**: a textura placeholder `"roach"`
  (`BootScene.generatePlaceholderTextures()`) era um círculo perfeitamente uniforme — girar um
  círculo uniforme via `sprite.setAngle()` não produz nenhuma mudança visual perceptível, o que
  tornaria toda a rotação de locomoção invisível (violando FR-001/SC-001/SC-002). Corrigido
  adicionando uma pequena marca ("cabeça") deslocada do centro à textura, em
  `client/src/scenes/BootScene.ts` — fora do arquivo único (`GameScene.ts`) previsto em `plan.md` §
  Project Structure, mas necessário para a feature ter qualquer efeito visual real. Não afeta o
  hit-testing (`CollisionSystem` continua usando `ROACH_VISUAL_RADIUS` como raio fixo, nunca lê
  pixels da textura) nem nenhuma outra feature que usa a textura `"roach"`.
- [P] = tarefas sem dependência de arquivo/lógica entre si — usado em T010/T011/T013 (Phase 5)
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Nenhuma tarefa de teste automatizado é gerada — decisão documentada em `plan.md` § Technical
  Context (sem função pura nova; `GameScene` é um Phaser `Scene` sem harness de teste automatizado
  neste projeto, mesmo padrão de `specs/008-juice-animacao-barata`)
- FR-007 (congela na pausa) e FR-006 (parar ao eliminar/roubar) são satisfeitos por construção, sem
  tarefa de implementação dedicada — `research.md` §5 explica por que reutilizar `logicalNow()` e o
  ciclo de vida já existente do `Map`/sprite já garante os dois (validados explicitamente nos
  cenários 3, 4 e 7 do quickstart, T005/T010)
- **Correção pós-`/speckit-analyze` (2026-09-26)**: FR-006 originalmente só mencionava o caminho de
  eliminação por clique — estendida para cobrir explicitamente também o roubo de comida (um desfecho
  comum de gameplay, não um edge case raro), com um novo cenário 4 no `quickstart.md` e o
  acceptance scenario 4 da User Story 1 em `spec.md`. T005 passou a validar os cenários 1-4 (era
  1-3); os cenários seguintes foram renumerados (antigo 4→5, 5→6, 6→7, 7→8), refletido em T009/T010/
  T011/T015
- O estilo fixo `"voando"` usado temporariamente em T004 é substituído pelo sorteio real em T007 —
  não é uma implementação descartável, é o mesmo código de produção evoluindo de "um estilo" para
  "dois estilos sorteados", mantendo User Story 1 independentemente entregável antes de US2 existir
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
