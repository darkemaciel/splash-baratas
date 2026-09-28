---
description: "Task list for specs/018-navegacao-pausa-fim"
---

# Tasks: Navegação completa da pausa e do fim de jogo

**Input**: Design documents from `/specs/018-navegacao-pausa-fim/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/navigation.md, quickstart.md

**Tests**: só para a regra de domínio nova (`MatchStateManager.forfeit`), exigida por
`contracts/navigation.md` ("Testes"). As cenas são validadas manualmente pelo `quickstart.md`. A
suíte existente precisa continuar passando sem alteração.

**Organization**: US1 = pausa com REINICIAR/ENCERRAR e diálogos (P1); US2 = MENU no fim de jogo (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência incompleta)
- **[Story]**: US1, US2
- Caminhos relativos à raiz do repositório; comandos rodam de `client/`.

## Regras transversais

- Cores, fontes, tamanhos, traços, sombras e opacidades só vêm de `client/src/config/theme.ts`.
- `entities/` não muda. Em `systems/`, só entra `forfeit` (FR-017).
- Todo botão vem de `createButton` (rótulo acessível via proxy; destruir o botão remove o proxy).
- Nenhum `resumeAll()` pode alcançar sons de uma partida descartada: sair da pausa por
  REINICIAR/ENCERRAR sempre chama `this.sound.stopAll()` antes (FR-012).

---

## Phase 1: Setup

- [X] T001 Em `client/src/config/theme.ts`, acrescentar `dialogo: 400` ao objeto `TAMANHO`, com
  comentário "Diálogo de confirmação: painel de 400px (design-system/components/Dialogo/README.md)".

---

## Phase 2: Foundational (bloqueia as histórias)

### Domínio (TDD)

- [X] T002 [P] Escrever `client/tests/unit/matchStateManager.forfeit.test.ts` com os 6 casos de
  `contracts/navigation.md § Domínio`, usando `new MatchStateManager()` como nos testes existentes
  (ex.: `matchStateManager.restart.test.ts`): (1) partida com `start(0)`, algumas eliminações ou
  roubos via `tick`, depois `forfeit(t)` → `true`, `status "lost"`, `endedAt t`, `score` e
  `foodItems` iguais aos de antes; (2) `on("match:lost")` chamado exatamente 1 vez, e um segundo
  `forfeit` → `false` sem nova emissão; (3) `forfeit` sem `start()` → `false` (`status
  "notStarted"`); (4) depois de `forfeit`, `tick(t + 60_000)` não cria baratas nem rouba comidas;
  (5) `elapsedMs(snapshot, t + 10_000) === t − startedAt`; (6) `restart(t2)` depois de `forfeit` →
  `status "playing"`, 9 comidas presentes, `score 0`, `endedAt null`.
- [X] T003 Implementar `forfeit(now: number): boolean` em `client/src/systems/MatchStateManager.ts`
  (research §1): se `this.match.status !== "playing"` devolve `false`; senão `this.match.endedAt =
  now`, `this.match.status = "lost"`, `this.emit("match:lost", this.getSnapshot())` e devolve
  `true`. Não mexe em `score`, `comboStreak`, `foodItems` nem `activeRoaches`. Docstring citando
  `specs/018-navegacao-pausa-fim` (FR-005/FR-006). Fazer T002 passar. Depende de T002.

### Kit de UI

- [X] T004 [P] Em `client/src/ui/Button.ts`, acrescentar `setPosition(x: number, y: number):
  Button` à interface `Button` e à implementação: tornar mutáveis as coordenadas base usadas por
  `applyState` (`let baseX = x; let baseY = y`), atualizar as duas, mover `root` e `zone` para
  `(baseX, baseY)` e parar qualquer tween em andamento. Todas as referências a `x`/`y` dentro de
  `applyState` e da criação da zona passam a usar `baseX`/`baseY`.
- [X] T004a Em `client/src/ui/a11y.ts`, acrescentar `focus(): void` à interface `A11yProxy` (sem
  efeito no proxy nulo) e exportar `isProxyFocused(): boolean` (`true` se `document.activeElement` é
  um `<button>` dentro de `#ui-a11y`; `false` sem DOM). Em `client/src/ui/Button.ts`, acrescentar
  `focus(): Button`, que chama `proxy.focus()` (FR-015a). Vem depois de T004 (mesmo `Button.ts`).
- [X] T005 Criar `client/src/ui/Dialog.ts` com `createDialog(scene, x, y, { titulo, texto,
  cancelar, confirmar, onCancelar, onConfirmar }): { destroy(): void }`, conforme
  `contracts/navigation.md § Kit de UI`: largura `min(TAMANHO.dialogo, GAME_WIDTH − 2 ·
  ESPACO.hudLateral)`; título com `createPanelTitle(scene, …, titulo, TEXTO.titulo_p.size)`; texto
  com `bodyText(…, TEXTO.corpo.size, TEXTO.corpo.weight, COR.traco)` e `wordWrap` na largura
  interna (largura − 2 · 32); botões `createButton` tamanho `"p"`: cancelar = `variant
  "terciario"`, `bolha "b"`; confirmar = `variant "primario"`, `bolha "a"`; lado a lado com vão
  `ESPACO.e12` se couberem na largura interna, senão empilhados (confirmar embaixo). Usar T004 para
  posicionar depois de medir. Painel com `createPanel` (padding 26/30, gap `ESPACO.e16`), altura
  calculada pelo conteúdo, centrado em `(x, y)`, e conteúdo em profundidade acima do painel.
  `destroy()` destrói painel, textos e os dois botões (com os proxies). Opção `focusCancel?: boolean`:
  com `true`, chama `cancelButton.focus()` logo após criar (FR-015a; nunca o botão de confirmar).
  Depende de T001, T004 e T004a.

**Checkpoint**: `bun test` verde (inclui T002) e `tsc --noEmit` sem erro.

---

## Phase 3: User Story 1 — Recomeçar ou desistir a partir da pausa (P1) 🎯 MVP

**Goal**: pausa com CONTINUAR / REINICIAR / ENCERRAR PARTIDA, cada ação destrutiva com diálogo de
confirmação (FR-001 a FR-007b, FR-012 a FR-014).

**Independent Test**: `quickstart.md` passos 1 a 6 e 9 (nos botões da pausa).

- [X] T006 [US1] Em `client/src/scenes/GameScene.ts`, `triggerPause()` passa a chamar
  `this.scene.launch("PauseOverlayScene", { pausedAtLogicalMs: this.logicalNow() })` (research §2).
  Nada mais muda na `GameScene`: o handler de `match:lost` que já existe atende o `forfeit`.
- [X] T007 [US1] Reescrever `client/src/scenes/PauseOverlayScene.ts` como máquina de estados
  (`data-model.md § Estado da PauseOverlayScene`):
  - `create(data: { pausedAtLogicalMs: number })` guarda `pausedAtLogicalMs`, zera `leaving =
    false`, cria a sobreposição (`COR.traco`, `ALFA.sobreposicao`) uma única vez e chama
    `showPanel()`.
  - `clearContent()` destrói tudo o que o estado atual criou (lista de objetos + botões via
    `button.destroy()` + `dialog.destroy()`).
  - `showPanel()`: estado `"painel"`; painel `min(TAMANHO.painelPausa, GAME_WIDTH − 2L)` com
    "PAUSADO" e a pilha (vão `ESPACO.e12`) CONTINUAR (`primario`, `m`, bolha `a`, `pilha`) →
    `resumeMatch()`; REINICIAR (`secundario`, `m`, bolha `b`, `pilha`) →
    `showDialog("reiniciar")`; ENCERRAR PARTIDA (`terciario`, `m`, bolha `a`, `pilha`,
    `a11yLabel "Encerrar partida"`) → `showDialog("encerrar")`. A altura do painel é calculada
    pelo conteúdo real (medir os botões) e o painel fica centrado na tela.
  - `showDialog(kind)`: estado `"confirmarReiniciar"`/`"confirmarEncerrar"`; `createDialog` centrado
    com os textos de `data-model.md § Textos novos` e `onCancelar → showPanel()`, `onConfirmar →
    restartMatch()` / `endMatch()`.
  - `resumeMatch()` (como hoje: `sound.resumeAll()`, `scene.resume("GameScene")`, `scene.stop()`),
    `restartMatch()` (`leaving = true`, `sound.stopAll()`,
    `matchStateManager.restart(this.time.now)`, `scene.start("GameScene")`) e `endMatch()`
    (`leaving = true`, `sound.stopAll()`, `matchStateManager.forfeit(this.pausedAtLogicalMs)`,
    `scene.stop()`). Os três começam com `if (this.leaving) return;`, e as trocas de estado também
    são ignoradas com `leaving`.
  - `keydown-P` chama `resumeMatch()` **só** no estado `"painel"` (FR-007b).
  - **Foco (FR-015a, research §8a)**: ao clicar REINICIAR/ENCERRAR PARTIDA, ler `const viaTeclado =
    isProxyFocused()` **antes** de `clearContent()`; abrir o diálogo com `focusCancel: viaTeclado` e
    guardar `viaTeclado` e qual botão abriu. Ao cancelar pelo diálogo, depois de `showPanel()`, se
    `viaTeclado`, chamar `focus()` no botão correspondente (REINICIAR ou ENCERRAR PARTIDA).
  - Depende de T003, T005 e T006.
- [X] T008 [US1] Validar a US1 pelo `quickstart.md` (passos 1 a 6, 9 e 11 para os botões da
  pausa) nas duas bases. Em especial: depois de REINICIAR, o botão Pausar da partida nova está no estado
  normal, e não há som de voo até a primeira barata; depois de ENCERRAR, os pontos no fim de jogo
  batem com o HUD da pausa.

**Checkpoint**: pausa completa. O fim de jogo ainda só tem DE NOVO!.

---

## Phase 4: User Story 2 — Voltar ao menu inicial depois de perder (P2)

**Goal**: DE NOVO! + MENU na etapa de resultado (FR-008 a FR-011, FR-013, FR-014).

**Independent Test**: `quickstart.md` passos 7, 8 e 9 (nos botões do fim de jogo).

- [X] T009 [US2] Em `client/src/scenes/GameOverScene.ts`:
  - acrescentar `private leaving = false`, zerado em `create()`;
  - em `showResults`, criar DE NOVO! (`primario`, `m`, bolha `a`, `a11yLabel "De novo!"`) e MENU
    (`secundario`, `m`, bolha `b`, `a11yLabel "Menu"`), medir as larguras e posicionar com
    `setPosition` (T004): lado a lado centralizados com vão `ESPACO.e16` se `larguraA + e16 +
    larguraB ≤ GAME_WIDTH − 2 · ESPACO.hudLateral`, senão empilhados com vão `ESPACO.e12` e DE
    NOVO! em cima;
  - incluir a altura extra da pilha no cálculo que reduz o padding do cartão (a invariante de
    caber na altura continua valendo);
  - DE NOVO! → `if (this.leaving) return; this.leaving = true;
    matchStateManager.restart(this.time.now)`;
  - MENU → `if (this.leaving) return; this.leaving = true; this.scene.start("StartScene")`.
  - Nenhum botão aparece na etapa de nome (sem mudança em `showNameEntry`). O empilhamento só
    acontece na base retrato, que tem altura de sobra; na paisagem, os dois cabem lado a lado.
    Depende de T004.
- [X] T010 [US2] Validar a US2 pelo `quickstart.md` (passos 7, 8 e 9) nas duas bases: MENU → tela
  inicial sem recarregar → JOGAR inicia partida normal; clique duplo em DE NOVO!/MENU faz uma única
  transição.

---

## Phase 5: Polish & Cross-Cutting

- [X] T011 Rodar `bun test`, `tsc --noEmit` e `bun run build` em `client/`: tudo verde, e os
  testes existentes sem edição.
- [ ] T012 Executar o passo 10 do `quickstart.md` (10 ciclos dos caminhos do SC-003) e conferir, pelo
  console, que `#ui-a11y` só tem os proxies da tela atual + o do som, e que não há som de voo fora
  de partida (FR-013, SC-003). **A parte de 60 FPS do SC-003 é manual** (aba normal, DevTools →
  Performance): a aba automatizada não renderiza quadros entre capturas (ver T037 da spec 017).
  Registrar como pendente se não puder ser medida.
  - **Resultado (2026-09-28, Chrome automatizado, paisagem e retrato)**: ✅ pausa com a pilha
    CONTINUAR/REINICIAR/ENCERRAR PARTIDA; diálogos com os textos da spec; P ignorado com o diálogo
    aberto; CONTINUAR do diálogo volta à pausa; REINICIAR → partida limpa (0:02, 9/9, Pausar normal);
    ENCERRAR → FIM DE JOGO com nome e entrada no Top 5 (3º, JOGADOR); DE NOVO! + MENU lado a lado
    dentro de 600px; clique duplo em MENU → uma transição; MENU → JOGAR → partida nova; foco pelo
    teclado (abre em CONTINUAR, volta para REINICIAR ao cancelar); `#ui-a11y` sem duplicados em
    todas as telas. **Correção feita na validação**: com a partida pausada, o proxy "Pausar" ainda
    era focável e um Enter nele relançava a overlay; `triggerPause()` agora retorna se a cena já
    estiver pausada.
  - **Pendente (manual, aba normal)**: os 10 ciclos completos seguidos e a medição de 60 FPS.
- [X] T013 [P] Atualizar `backlog.md` §8: marcar "REINICIAR e ENCERRAR PARTIDA na pausa" e "DE
  NOVO! + MENU no fim de jogo" como ✅ **Entregue** via `specs/018-navegacao-pausa-fim` (com a
  confirmação por diálogo e a partida encerrada entrando no ranking).
- [ ] T014 Marcar `specs/018-navegacao-pausa-fim/spec.md` como `**Status**: Implemented` depois de
  T011 e T012.

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational**: T002 → T003; T004 → T004a → T005 (T005 também depende de T001).
- **US1**: T006 → T007 (depende de T003 e T005) → T008.
- **US2**: T009 (depende só de T004) → T010. Independente da US1: pode ser feita em paralelo.
- **Polish**: depois das histórias.

### Arquivos compartilhados

- `client/src/ui/Button.ts`: T004 → T004a.
- `client/src/scenes/PauseOverlayScene.ts`: só T007.
- `client/src/scenes/GameOverScene.ts`: só T009.

### Parallel Opportunities

- T002 ∥ T004 (arquivos diferentes). Depois, T003 ∥ T005.
- Com a Phase 2 pronta: US1 (T006 → T007) ∥ US2 (T009).
- T013 ∥ T011/T012.

## Parallel Example

```text
Task: "T002 matchStateManager.forfeit.test.ts"   ∥   Task: "T004 Button.setPosition"
Task: "T007 [US1] PauseOverlayScene"             ∥   Task: "T009 [US2] GameOverScene DE NOVO! + MENU"
```

## Implementation Strategy

1. Setup + Foundational: `forfeit` testado, `Dialog` e `setPosition` prontos.
2. US1 (MVP): pausa com as três ações e confirmação, que é a lacuna mais sentida.
3. US2: MENU no fim de jogo.
4. Polish: ciclos de repetição, backlog e status.
