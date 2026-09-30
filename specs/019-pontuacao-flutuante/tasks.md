---
description: "Task list for specs/019-pontuacao-flutuante"
---

# Tasks: Pontuação flutuante "+N!"

**Input**: Design documents from `/specs/019-pontuacao-flutuante/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/floating-score.md, quickstart.md

**Tests**: pedidos por `contracts/floating-score.md` para as duas partes puras: pontos no evento de
domínio e a função de posição. A cena é validada manualmente pelo `quickstart.md`. A suíte existente
continua passando sem alteração.

**Organization**: uma única história (US1, P1). Os testes e as funções puras estão em Foundational
porque a US1 depende deles.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência incompleta)
- Caminhos relativos à raiz; comandos rodam de `client/`.

## Regras transversais

- Nenhuma regra de pontuação muda (FR-013): `applyEliminationScore` e as constantes de
  `gameConfig.ts` não são editadas.
- O número nunca chama `setInteractive` (FR-006) e nunca é criado antes de `tryEliminateRoach`
  terminar (Princípio V).
- Valores visuais e de movimento só vêm de `theme.ts` (`TEXTO.pontuacao_flutuante`,
  `MOVIMENTO.pontuacao`, `MOVIMENTO.pata.golpeEscala`, `ESPACO`).

---

## Phase 1: Setup

Nenhuma tarefa. O projeto, as fontes e os tokens já existem (spec 017).

---

## Phase 2: Foundational (bloqueia a US1)

### Pontos no evento de domínio (TDD)

- [X] T001 [P] Escrever `client/tests/unit/matchStateManager.eliminatedPoints.test.ts` com os 4
  casos de `contracts/floating-score.md § Domínio`, usando `new MatchStateManager()`, `start(0)` e
  `tick(2500)` para obter a barata, como em `matchStateManager.score.test.ts`: (1) `on("roach:eliminated",
  ({ points }) => …)` recebe `points` igual ao aumento de `getSnapshot().score`; (2) duas eliminações
  dentro de `COMBO_WINDOW_MS`: a soma dos `points` é igual ao `score` final e o 2º `points` inclui
  `comboBonusPoints(2)`; (3) eliminação depois do prazo (`spawnedAt + travelDurationMs + 1`) não emite
  o evento; (4) numa partida isolada, eliminar com `reactionMs` pequeno dá `points` maior que com
  `reactionMs = 2000`.
- [X] T002 Em `client/src/systems/MatchStateManager.ts`: mudar `MatchEventPayloads["roach:eliminated"]`
  para `{ roachId: string; points: number }`; em `tryEliminateRoach`, guardar o retorno de
  `applyEliminationScore(...)` em `const points` e emitir `{ roachId, points }`. A assinatura e o
  retorno `boolean` de `tryEliminateRoach` não mudam. Comentário citando
  `specs/019-pontuacao-flutuante` (research §1). Fazer T001 passar. Depende de T001.

### Regra de posição (TDD)

- [X] T003 [P] Escrever `client/tests/unit/ui.floatingScoreLayout.test.ts` com os 6 casos de
  `contracts/floating-score.md § Kit de UI` (o 6º cobre `rotatedBounds`), usando `paw = { halfWidth: 20, halfHeight: 35 }`,
  `textWidth 90`, `textHeight 50`, `gap 8`, `margin 4`, `riseReserved 48`: (1) meio da tela:
  `x === px` e `y + textHeight/2 === py − paw.halfHeight − gap`; (2) `px = 5` e `px = screenWidth −
  5`: o texto fica inteiro (`x − w/2 ≥ margin`, `x + w/2 ≤ screenWidth − margin`); (3) `py = 40`
  (topo): o retângulo do número fica ao lado da pata (à direita), e com `px = screenWidth − 10`, à
  esquerda; (4) propriedade: para uma grade de `px` e `py` de 10 em 10px sobre 960×600 e 480×960, o
  retângulo do número (sem rotação) nunca intersecta o retângulo da pata `[px ± halfWidth, py ±
  halfHeight]` e fica sempre dentro da tela; (5) com `riseReserved = 0`, um `py` que forçaria o
  lado com 48 cabe acima; (6) `rotatedBounds`: 0° mantém, 90° troca largura e altura, e o sinal do
  ângulo não importa. Os casos 1 a 5 recebem `textWidth/textHeight` e `paw` já como caixas
  envolventes (a função de posição trabalha com retângulos alinhados).
- [X] T004 Criar `client/src/ui/floatingScoreLayout.ts` (sem `import phaser`) com
  `rotatedBounds(width, height, angleDeg)` (`w·|cos θ| + h·|sin θ|` por `w·|sin θ| + h·|cos θ|`), a interface
  `FloatingScoreLayoutInput { px, py, textWidth, textHeight, paw: { halfWidth, halfHeight },
  riseReserved, screenWidth, screenHeight, gap, margin }` e `floatingScorePosition(input): { x, y }`
  implementando research §3 (passos 1 a 5): tentar acima; se `yDesejado < minY`, ir para o lado
  direito (`px + halfWidth + gap + w/2`), ou para o esquerdo se o direito passar de `screenWidth −
  margin`, com `y = clamp(py, minY, maxY)`; sempre limitar `x` e `y` à tela. Fazer T003 passar.
  Depende de T003.

### Kit de UI

- [X] T005 [P] Em `client/src/ui/OutlinedTitle.ts`, acrescentar a opção `outline?: "titulo" |
  "pontuacao"` (padrão `"titulo"`): `"titulo"` mantém `strokeThickness 8` e sombra 7 (sem mudança
  para quem já usa); `"pontuacao"` usa `strokeThickness 6` (3px em volta) e sombra 5 (componente
  PontuacaoFlutuante). O `padding` do texto acompanha a sombra escolhida.
- [X] T006 Criar `client/src/ui/FloatingScore.ts` com `export const FLOATING_SCORE_DEPTH = 30`,
  `export interface PawGeometry { halfWidth: number; halfHeight: number }` e `createFloatingScore(scene,
  px, py, points, paw)`:
  - texto via `createOutlinedTitle(scene, 0, 0, \`+${formatThousands(points)}!\`, { size:
    TEXTO.pontuacao_flutuante.size, angle: MOVIMENTO.pontuacao.inclinacaoDeg, outline: "pontuacao" })`,
    `setDepth(FLOATING_SCORE_DEPTH)` e **sem** `setInteractive`;
  - posição por `floatingScorePosition` com `textWidth/textHeight` = `rotatedBounds(text.width,
    text.height, MOVIMENTO.pontuacao.inclinacaoDeg)` (o texto é criado com ângulo, então mede-se
    `width/height` sem giro e aplica-se a caixa envolvente), `riseReserved = prefersReducedMotion ? 0 : MOVIMENTO.pontuacao.subidaPx`, `gap =
    ESPACO.e8`, `margin = ESPACO.e4`, `screenWidth = GAME_WIDTH`, `screenHeight = GAME_HEIGHT`;
  - animação: sem movimento reduzido, `scene.tweens.add({ targets: text, y: y −
    MOVIMENTO.pontuacao.subidaPx, alpha: 0, duration: MOVIMENTO.pontuacao.ms, ease: "Quad.easeOut",
    onComplete: () => text.destroy() })`; com movimento reduzido, `scene.time.delayedCall(MOVIMENTO.pontuacao.ms,
    () => text.destroy())`.
  - Depende de T004 e T005.

**Checkpoint**: `bun test` verde (T001 e T003 incluídos) e `tsc --noEmit` sem erros.

---

## Phase 3: User Story 1 — Ver quantos pontos cada barata rendeu (P1) 🎯 MVP

**Goal**: a cada eliminação, "+N!" acima da pata, subindo e sumindo em 720ms (FR-001 a FR-014).

**Independent Test**: `quickstart.md` passos 1 a 10.

- [X] T007 [US1] Em `client/src/scenes/GameScene.ts`:
  - novo campo `private lastHitPoint = { x: 0, y: 0 }`; em `handlePointerDown`, logo antes de
    `matchStateManager.tryEliminateRoach(hit.id, now)`, gravar `this.lastHitPoint = { x: pointer.x,
    y: pointer.y }` (research §2: `emit` é síncrono, então o handler lê este ponto na mesma
    chamada);
  - novo campo `private pawGeometry!: PawGeometry`, calculado em `create()`: `ph =
    CURSOR_PAW_HEIGHT_PX * MOVIMENTO.pata.golpeEscala`; se `this.textures.exists("cursor-paw")`, `pw =
    ph * (source.width / source.height)` de `getSourceImage()`, senão `pw = ph`; `const b =
    rotatedBounds(pw, ph, MOVIMENTO.pata.golpeAnguloDeg)`; `pawGeometry = { halfWidth: b.width / 2,
    halfHeight: b.height / 2 }` (caixa da pata no tapa, escalada e girada);
  - trocar a inscrição `matchStateManager.on("roach:eliminated", ({ roachId }) =>
    this.playRoachEliminated(roachId))` para repassar `points`, e em `playRoachEliminated(roachId,
    points)` chamar `createFloatingScore(this, this.lastHitPoint.x, this.lastHitPoint.y, points,
    this.pawGeometry)` **antes** do `return` de "sprite não encontrado" (o número aparece mesmo se o
    sprite já tiver sido removido).
  - Nada muda em `handlePointerDown` além da linha do `lastHitPoint`. O `cursor:strike` continua
    emitido depois de tudo.
  - Depende de T002 e T006.
- [X] T008 [US1] Validar a US1 pelo `quickstart.md` (passos 1 a 10) em paisagem e retrato, com
  atenção a: soma dos N igual ao aumento de PONTOS; números no topo ao lado da pata; pausa congela;
  nada depois de REINICIAR ou ENCERRAR.

---

## Phase 4: Polish & Cross-Cutting

- [X] T009 Rodar `bun test`, `tsc --noEmit` e `bun run build` em `client/`: tudo verde, e os testes
  existentes sem edição.
- [X] T010 [P] Em `backlog.md` §8, marcar "Pontuação flutuante '+50!'" como ✅ **Entregue** via
  `specs/019-pontuacao-flutuante` (nasce acima da pata do gato; pontos reais da eliminação).
- [X] T011 Registrar em T008, no `specs/019-pontuacao-flutuante/tasks.md`, o que não puder ser medido
  na aba automatizada (60 FPS do SC-004, passo 11 do quickstart; duração de 720ms do SC-002, que vem da
  constante `MOVIMENTO.pontuacao.ms`).
  - **Resultado (2026-09-28, Chrome automatizado, paisagem)**: ✅ acerto em barata mostrou "+110!"
    acima da pata, inclinado para a direita, com contorno e sombra, igual ao aumento de PONTOS
    (0 → 110), subindo e sumindo; barata passando pelo topo aparece por cima das pílulas; um número
    ainda na tela some ao REINICIAR (FR-012). `bun test` 142/142 (10 novos), `tsc` e build ok.
  - **Pendente (manual, aba normal)**: 60 FPS com 10 eliminações em 5s (SC-004), tempo real de
    720ms (a aba automatizada não desenha quadros entre capturas, então a animação avança devagar
    aqui), posição ao lado da pata num acerto no topo (coberta pela varredura de posições em
    `ui.floatingScoreLayout.test.ts`, sem conferência visual), movimento reduzido e retrato.
- [ ] T012 Marcar `specs/019-pontuacao-flutuante/spec.md` como `**Status**: Implemented` quando a
  validação manual pendente de T011 for feita.

---

## Dependencies & Execution Order

- T001 → T002 (domínio). T003 → T004 → T006 ← T005.
- T007 depende de T002 e T006. T008 depende de T007.
- Polish depois da US1.

### Parallel Opportunities

- T001 ∥ T003 ∥ T005 (arquivos diferentes).
- Depois: T002 ∥ T004.
- T010 ∥ T009.

## Parallel Example

```text
Task: "T001 matchStateManager.eliminatedPoints.test.ts"
Task: "T003 ui.floatingScoreLayout.test.ts"
Task: "T005 OutlinedTitle outline: pontuacao"
```

## Implementation Strategy

1. Foundational: evento com `points` e posição testados; componente pronto.
2. US1: ligar na `GameScene` e validar. A história inteira é o MVP.
3. Polish: verificação final e backlog.
