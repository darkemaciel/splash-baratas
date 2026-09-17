---

description: "Task list template for feature implementation"
---

# Tasks: Juice na Animação da Barata

**Input**: Design documents from `/specs/008-juice-animacao-barata/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/roach-juice-effect.md,
quickstart.md

**Tests**: não incluídas — `plan.md` § Technical Context e `research.md` §7 decidem explicitamente
por validação manual via `quickstart.md`, já que esta feature não introduz nenhuma função pura
nova em `entities/`/`systems/` (nada para `bun test` cobrir automaticamente; consistente com o
padrão já usado para comportamento de `Scene`/sprites do Phaser em `001`/`003`/`007`).

**Organization**: Tasks agrupadas por user story (spec.md) para permitir implementação e teste
independentes de cada uma.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefas incompletas)
- **[Story]**: A qual user story esta tarefa pertence (US1, US2, US3)
- Caminhos de arquivo exatos em cada descrição

## Path Conventions

Projeto único — `client/src/scenes/GameScene.ts` (ver `plan.md` → Project Structure). Nenhuma pasta
ou arquivo novo é criado; toda a mudança de código é aditiva sobre um único arquivo já existente do
MVP (`001-roach-fridge-clicker`).

---

## Phase 1: Setup

**Purpose**: Confirmar um ponto de partida limpo antes de tocar em `GameScene.ts`.

- [X] T001 Rodar `bun test` em `client/` e confirmar que toda a suíte existente passa antes de
  iniciar qualquer alteração (baseline; nenhuma dependência nova é necessária — `plan.md` §
  Technical Context)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Nenhuma tarefa fundacional é necessária nesta feature. Toda a implementação nova
pertence exclusivamente à User Story 1 (o efeito visual em si); User Story 2 e User Story 3 apenas
validam esse mesmo código sob ângulos diferentes (precisão de clique e performance sob carga),
sem exigir nenhuma infraestrutura própria adicional. Ver seção "Dependencies & Execution Order"
abaixo.

**Checkpoint**: nada a fazer aqui — User Story 1 pode começar imediatamente após o Setup.

---

## Phase 3: User Story 1 - Perceber a urgência crescente na animação da barata (Priority: P1) 🎯 MVP

**Goal**: Aplicar squash/stretch e tremor ao sprite de cada barata ativa, com intensidade
proporcional ao seu `progress(roach, now)` — zero no spawn, máxima ao alcançar o alvo — e
independente entre baratas simultâneas (FR-001, FR-002, FR-003, FR-008).

**Independent Test**: deixar uma barata percorrer o trajeto sem clicar nela e observar que o
squash/stretch e o tremor ficam visivelmente mais pronunciados perto do alvo do que no spawn; com
múltiplas baratas ativas ao mesmo tempo, confirmar que cada uma anima de forma independente,
proporcional apenas ao próprio progresso.

### Implementation for User Story 1

- [X] T002 [US1] Em `client/src/scenes/GameScene.ts`, adicionar as constantes do efeito no topo do
  arquivo (junto às demais constantes de HUD já existentes): `SQUASH_STRETCH_MAX_DELTA = 0.18`,
  `SQUASH_STRETCH_FREQUENCY_HZ = 4`, `TREMOR_MAX_OFFSET_PX = 4`, `TREMOR_BASE_FREQUENCY_HZ = 6`,
  `TREMOR_MAX_FREQUENCY_HZ = 14` — valores exatos de `contracts/roach-juice-effect.md` §
  "Constantes do efeito"
- [X] T003 [US1] Em `client/src/scenes/GameScene.ts`, adicionar o método privado
  `roachPhase(roachId: string): number`, que soma os code points dos caracteres de `roachId` e
  normaliza o resultado para um valor em radianos no intervalo `[0, 2π)`, usado como offset de fase
  determinístico para dessincronizar baratas diferentes (research.md §5, data-model.md § "Fase por
  barata") (depende de T002 apenas por convenção de ordem no arquivo, sem dependência funcional
  real)
- [X] T004 [US1] Em `client/src/scenes/GameScene.ts`, implementar o método privado
  `computeRoachSquashStretch(roach: Roach, now: number): { scaleX: number; scaleY: number }`:
  `wobble = Math.sin(now / 1000 * SQUASH_STRETCH_FREQUENCY_HZ * 2 * Math.PI + this.roachPhase(roach.id))`,
  `delta = SQUASH_STRETCH_MAX_DELTA * progress(roach, now) * wobble`, retornando
  `{ scaleX: 1 + delta, scaleY: 1 - delta }` — fórmula exata de `research.md` §3 (depende de T002,
  T003; usa `progress` já importado de `entities/Roach.ts`)
- [X] T005 [US1] Em `client/src/scenes/GameScene.ts`, implementar o método privado
  `computeRoachTremorOffset(roach: Roach, now: number): { dx: number; dy: number }`:
  `frequency = TREMOR_BASE_FREQUENCY_HZ + progress(roach, now) * (TREMOR_MAX_FREQUENCY_HZ - TREMOR_BASE_FREQUENCY_HZ)`,
  `amplitude = TREMOR_MAX_OFFSET_PX * progress(roach, now)`,
  `dx = amplitude * Math.sin(now / 1000 * frequency * 2 * Math.PI + this.roachPhase(roach.id))`,
  `dy = amplitude * Math.cos(now / 1000 * frequency * 1.3 * 2 * Math.PI + this.roachPhase(roach.id))`
  — fórmula exata de `research.md` §4 (depende de T002, T003)
- [X] T006 [US1] Em `syncRoachSprites()` de `client/src/scenes/GameScene.ts`, logo após calcular
  `position = positionAt(roach, this.time.now, targetPosition)` (já existente), chamar
  `computeRoachSquashStretch`/`computeRoachTremorOffset` e aplicar ao sprite (tanto no branch de
  criação quanto no de atualização): `sprite.setPosition(position.x + tremor.dx, position.y +
  tremor.dy)` e `sprite.setScale(squash.scaleX, squash.scaleY)` — a posição base continua sendo
  exatamente `position` (nenhuma mudança em como `position` é calculada) (depende de T004, T005)
- [X] T007 [US1] Validar manualmente os cenários 1, 2 e 4 do
  `specs/008-juice-animacao-barata/quickstart.md` (intensidade crescendo com a proximidade do alvo;
  múltiplas baratas animando de forma independente e dessincronizada; efeito parando imediatamente
  ao eliminar ou ao roubar a comida-alvo, sem resíduo visual — FR-005) rodando `bun run dev` em
  `client/`

**Checkpoint**: User Story 1 completa e testável de forma independente — efeito de urgência visual
funcional em todas as baratas ativas.

---

## Phase 4: User Story 2 - Continuar clicando com a mesma precisão de sempre (Priority: P2)

**Goal**: Garantir que o efeito visual introduzido pela User Story 1 nunca altere a posição usada
para detectar cliques — a área clicável da barata continua exatamente a mesma de antes desta
feature (FR-004).

**Independent Test**: clicar repetidamente em baratas em diferentes pontos do trajeto (incluindo
perto do alvo, onde o efeito é mais intenso) e confirmar que a eliminação acontece exatamente
quando o clique cai sobre a posição real da barata, sem nenhuma diferença perceptível de precisão
em relação ao comportamento sem o efeito.

### Implementation for User Story 2

- [X] T008 [US2] Em `handlePointerDown()` de `client/src/scenes/GameScene.ts`, imediatamente antes
  da linha que chama `positionAt(roach, now, targetPosition)` para montar `candidates`, adicionar
  um comentário curto documentando o invariante: o hit-test usa exclusivamente `positionAt()`, nunca
  `sprite.x`/`sprite.y`/`sprite.scaleX`/`sprite.scaleY` do sprite renderizado por
  `syncRoachSprites()` (T006) — referenciar `contracts/roach-juice-effect.md` § "Garantia de
  não-interferência no hit-testing" para proteger este ponto contra regressões futuras (depende de
  T006; nenhuma mudança de comportamento, apenas o comentário — o código já satisfaz o invariante
  por construção, já que `handlePointerDown` nunca leu propriedades do sprite)
- [X] T009 [US2] Validar manualmente o cenário 3 do
  `specs/008-juice-animacao-barata/quickstart.md` (precisão de clique inalterada, incluindo o
  clique deliberado na "sobra" visual do tremor perto do alvo) rodando `bun run dev` em `client/`

**Checkpoint**: User Stories 1 e 2 funcionam de forma independente — efeito visual presente sem
nenhuma regressão de precisão de clique.

---

## Phase 5: User Story 3 - Jogo continua fluido com várias baratas animadas ao mesmo tempo (Priority: P3)

**Goal**: Confirmar que o efeito se mantém performático (60 FPS estável) mesmo com o número máximo
de baratas simultâneas permitido pelo jogo exibindo squash/stretch e tremor ao mesmo tempo
(FR-006).

**Independent Test**: deixar o número máximo de baratas simultâneas ativo na tela ao mesmo tempo,
todas exibindo o efeito, e confirmar visualmente que o jogo continua fluido, sem engasgos
perceptíveis no movimento das baratas ou atraso na resposta ao clique.

### Implementation for User Story 3

- [X] T010 [US3] Revisar `computeRoachSquashStretch`/`computeRoachTremorOffset` (T004, T005) e
  confirmar que cada chamada é O(1) (poucas operações trigonométricas, sem laços, sem alocação de
  arrays) — nota de design/checagem, sem exigir mudança de código se a implementação de T004/T005
  já estiver conforme a fórmula de `research.md` §3/§4 (depende de T004, T005)
- [X] T011 [US3] Validar manualmente a seção "Critérios de aceite de performance" do
  `specs/008-juice-animacao-barata/quickstart.md` (60 FPS estável com o número máximo de baratas
  simultâneas, todas exibindo o efeito) usando o painel de performance do navegador, rodando
  `bun run dev` em `client/` (depende de T006)

**Checkpoint**: as três user stories funcionam de forma independente e em conjunto — efeito de
urgência visual completo, sem regressão de precisão de clique ou performance.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação final cobrindo toda a feature de ponta a ponta.

- [X] T012 Rodar `bun test` completo em `client/` e confirmar zero regressões na suíte existente
  (nenhum teste novo é esperado — esta feature não adiciona funções puras a `entities/`/`systems/`)
- [X] T013 [P] Rodar `tsc --noEmit` e `bun run build` em `client/` e confirmar zero erros de
  compilação/build
- [X] T014 Rodar a validação manual completa de
  `specs/008-juice-animacao-barata/quickstart.md` (todos os cenários e os critérios de performance)
  como conferência final de ponta a ponta

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências — pode começar imediatamente
- **Foundational (Phase 2)**: vazia — não bloqueia nada além do próprio Setup
- **User Story 1 (Phase 3)**: depende de Setup — é o MVP; toda a implementação nova da feature vive
  aqui
- **User Story 2 (Phase 4)**: depende de User Story 1 (T006) já existir — não há nada para validar
  ou documentar sem o efeito visual presente
- **User Story 3 (Phase 5)**: depende de User Story 1 (T006) já existir — não há efeito nenhum para
  medir performance sem ele
- **Polish (Phase 6)**: depende de todas as user stories completas

### User Story Dependencies

- **User Story 1 (P1)**: depende apenas de Setup — nenhuma dependência de outra story
- **User Story 2 (P2)**: depende do código produzido pela User Story 1 (não é uma implementação
  independente — é uma garantia/validação sobre o mesmo código), mas é independentemente
  **testável**: dá para confirmar a precisão do clique assim que US1 estiver pronta, antes de medir
  performance (US3)
- **User Story 3 (P3)**: depende do código produzido pela User Story 1, pelo mesmo motivo de US2;
  independentemente **testável** em relação a US2 (mede um aspecto diferente — performance sob
  carga, não precisão de clique)

### Within Each User Story

- Constantes e helper de fase antes das fórmulas que os usam (T002/T003 → T004/T005)
- Fórmulas de squash/stretch e tremor antes de serem aplicadas em `syncRoachSprites` (T004,
  T005 → T006)
- Implementação antes da validação manual em cada story (T006→T007, T008→T009, T010→T011)

### Parallel Opportunities

- T004 e T005 (as duas fórmulas, squash/stretch e tremor) podem ser implementadas em paralelo —
  são métodos independentes, ambos consumindo apenas T002/T003, sem um depender do outro
- Na Phase 6, T013 (`tsc`/build) pode rodar em paralelo com a validação manual T014
- Fora esses casos, as tarefas de implementação formam uma cadeia majoritariamente sequencial
  (mesmo arquivo `GameScene.ts`)

---

## Parallel Example: User Story 1

```bash
# T004 e T005 podem ser implementados em paralelo (métodos independentes no mesmo arquivo):
Task: "Implementar computeRoachSquashStretch(roach, now) em client/src/scenes/GameScene.ts"
Task: "Implementar computeRoachTremorOffset(roach, now) em client/src/scenes/GameScene.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 3: User Story 1 (Phase 2 não tem tarefas)
3. **PARAR e VALIDAR**: testar a User Story 1 de forma independente (T007)
4. Neste ponto já existe o item P1 do backlog ("Juice na animação da barata") funcional — reforço
   visual de urgência presente em todas as baratas

### Incremental Delivery

1. Setup → ponto de partida confirmado
2. User Story 1 → testar independentemente → efeito visual completo e funcional
3. User Story 2 → testar independentemente → precisão de clique confirmada sem regressão
4. User Story 3 → testar independentemente → performance confirmada sob carga máxima
5. Polish → regressão de testes, build limpo, validação de ponta a ponta

---

## Notes

- [P] = tarefas sem dependência de arquivo/lógica entre si — usado aqui apenas em T004/T005 (Phase
  3) e T013 (Phase 6)
- [Story] mapeia cada tarefa à user story correspondente para rastreabilidade
- Nenhuma tarefa de teste automatizado é gerada — decisão documentada em `plan.md` § Technical
  Context e `research.md` §7 (sem função pura nova; Phaser `Scene`/sprites não têm harness de teste
  automatizado neste projeto)
- FR-005 (efeito para imediatamente ao eliminar/roubar) e FR-007 (nenhuma regra de domínio é
  alterada) são satisfeitos por construção, sem tarefa de implementação dedicada — `research.md` §6
  explica por que o comportamento já existente de `playRoachEliminated`/`playFoodStolen` (remover o
  sprite do `Map` antes do tween) já cobre FR-005 (validado explicitamente pelo cenário 4 do
  quickstart em T007), e nenhuma task desta lista toca `entities/`/`systems/` (satisfazendo FR-007
  por omissão; T012 — `bun test` na suíte de domínio inalterada — funciona como rede de regressão
  para essa garantia)
- Parar em qualquer checkpoint para validar a story correspondente de forma independente
