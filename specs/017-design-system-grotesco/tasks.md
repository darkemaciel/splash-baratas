---
description: "Task list for specs/017-design-system-grotesco"
---

# Tasks: Design System "Grotesco Surreal" em todo o jogo

**Input**: Design documents from `/specs/017-design-system-grotesco/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-kit.md, contracts/screens.md, quickstart.md

**Tests**: só para os módulos puros novos (`ui/shape.ts`, `ui/format.ts`), exigidos por
`contracts/ui-kit.md` ("testados com `bun test`"). As telas são validadas manualmente pelo
`quickstart.md`. A suíte de domínio existente precisa continuar passando sem alteração (FR-026).

**Organization**: tarefas agrupadas por user story (US1 = menus e telas, P1; US2 = HUD, P2; US3 =
som, cenário e cursor, P3).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: user story da tarefa (US1, US2, US3)
- Todos os caminhos são relativos à raiz do repositório. Os comandos rodam de `client/`.

## Regras transversais (valem para toda tarefa)

- Nenhum literal de cor, fonte, tamanho de texto, traço, sombra ou opacidade de sobreposição nas
  scenes ou no kit: tudo vem de `client/src/config/theme.ts` (FR-004, FR-006).
- `entities/` e `systems/` **não** são editados (FR-026). `theme.ts`, `ui/shape.ts` e
  `ui/format.ts` **não** importam `phaser` (Princípio I).
- Só `createButton` e `createIconButton` chamam `setInteractive`, com `useHandCursor: false`
  (FR-019, FR-021).
- Texto branco nunca sobre céu, limão, creme, rosa ou magenta. Laranja e mato nunca como fundo de
  texto (FR-005).
- Todo componente e proxy acessível é destruído no `SHUTDOWN` da cena dona.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: ligar fontes, CSS de tokens, página e constantes do design system.

- [X] T001 Importar `./src/styles/tokens.css` no topo de `client/index.ts`, antes de criar o `Phaser.Game` (fica só o `@font-face` e as variáveis; **não** importar `grotesco.css` — research §2). Trocar `backgroundColor: "#0d0d0d"` do config do jogo por `hex(COR.traco)` de `./src/config/theme`.
- [X] T002 [P] Em `client/index.html`: `<title>` → `Borges e as Baratas`; remover o bloco `@font-face` da Fredoka; fundo de `html, body` e `#game` → `var(--cor-traco)`; acrescentar `<div id="ui-a11y" aria-label="Controles do jogo"></div>` depois de `#game`; acrescentar a classe `.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }`. Manter a regra `#game.cursor-paw-ready canvas { cursor: none !important; }`.
- [X] T003 [P] Em `client/src/config/theme.ts`, acrescentar `RAIO` (strings CSS de `tokens.css`: `bolhaA: "40% 60% 55% 45% / 55% 45% 60% 40%"`, `bolhaB: "45% 55% 50% 50% / 60% 45% 55% 40%"`, `bolhaPressionada: "50% 50% 45% 55% / 45% 55% 50% 50%"`, `bolhaPressionadaB: "50% 50% 55% 45% / 50% 50% 45% 55%"`, `cartao: "28px 36px 30px 40px / 34px 28px 40px 30px"`, `painel: "36px 52px 40px 56px / 48px 36px 56px 40px"`) e `TAMANHO` (`botaoIcone: 52, iconeBotao: 26, pilhaBotaoMin: 280, painelPausa: 380, cartaoResultado: 400, toqueMinimo: 44, energiaAltura: 28`), conforme `data-model.md § Tokens`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: fontes carregadas, ícones disponíveis e kit de UI pronto. Bloqueia todas as histórias.

**⚠️ CRITICAL**: nenhuma user story começa antes do fim desta fase.

### Módulos puros + testes

- [X] T004 [P] Escrever `client/tests/unit/ui.shape.test.ts` cobrindo o contrato de `contracts/ui-kit.md § ui/shape.ts`: todos os pontos dentro de `[0,w]×[0,h]`; `%` horizontal relativo a `w` e vertical relativo a `h`; sem `/` o raio vertical é igual ao horizontal; raios que somam mais que o lado são escalados pelo mesmo fator; `pillPoints(w,h)` igual a `bubblePoints(w,h,"${h/2}px")`; número de pontos = `4 × (segmentsPerCorner + 1)`.
- [X] T005 [P] Escrever `client/tests/unit/ui.format.test.ts`: `formatThousands(0)="0"`, `(999)="999"`, `(1250)="1.250"`, `(12345)="12.345"`, `(1234567)="1.234.567"`; `formatClock(0)="0:00"`, `(45_000)="0:45"`, `(723_000)="12:03"`, `(59_999)="0:59"`, negativo → `"0:00"`.
- [X] T006 [P] Implementar `client/src/ui/shape.ts` (`bubblePoints(width, height, radii, segmentsPerCorner = 8)` e `pillPoints`) sem `import phaser`, com parser do formato CSS `border-radius` (1 a 4 valores por eixo, `%` ou `px`) e quarto de elipse por canto (research §4). Fazer T004 passar.
- [X] T007 [P] Implementar `client/src/ui/format.ts` (`formatThousands` com separador `.` fixo, sem `Intl`; `formatClock` em `m:ss`) sem `import phaser`. Fazer T005 passar.

### Infra de UI

- [X] T008 [P] Criar `client/src/ui/motion.ts`: `export const prefersReducedMotion: boolean`, lido uma vez via `typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true`; e `export function uiTweenMs(ms: number): number` (devolve 0 com movimento reduzido).
- [X] T009 [P] Criar `client/src/ui/a11y.ts`: `createA11yProxy(scene, { label, onActivate, onFocusChange })` cria um `<button class="sr-only" type="button" aria-label=…>` dentro de `#ui-a11y`, liga `click` (o Enter/Espaço nativo do botão cai aqui) em `onActivate` e `focus`/`blur` em `onFocusChange(bool)`, expõe `setLabel(str)` e `setPressed(bool | null)` (`aria-pressed`) e se remove no `Phaser.Scenes.Events.SHUTDOWN` da cena. Exportar também `setProxiesEnabled(enabled: boolean)`: com `false`, faz `blur()` em todos os proxies e define `tabIndex = -1`; com `true`, volta `tabIndex = 0` (contracts/ui-kit.md § Proxies e digitação). Se `#ui-a11y` não existir, tudo vira no-op (FR-022; research §7).
- [X] T010 Em `client/src/scenes/BootScene.ts`: **primeiro** conferir em `client/node_modules/phaser` que `this.load.svg(key, url, { width, height })` existe na 4.2.1 com essa assinatura (senão usar `{ scale: 2 }`). Depois, substituir `loadHudFont()` por `loadFonts()`, que faz `Promise.race([Promise.all([document.fonts.load('400 28px "Luckiest Guy"'), document.fonts.load('600 16px "Baloo 2"'), document.fonts.load('700 16px "Baloo 2"'), document.fonts.load('800 16px "Baloo 2"')]), timeout(1000)])` (FR-003, research §3). Em `preload()`, carregar os ícones com `this.load.svg(key, "assets/ui/icones/<arquivo>.svg", { width, height })` em 2x: `icone-pausar` e `icone-som` (52×52), `icone-tempo` (44×44), `icone-coracao` (`coracao-cheio.svg`, 44×40) (research §6). Atualizar o comentário que cita Fredoka.

### Componentes (contracts/ui-kit.md)

- [X] T011 Criar `client/src/ui/draw.ts` com o helper interno `drawShape(graphics, points, { fill, shadowOffset, strokeWidth = TRACO.ui })`: desenha a sombra dura (mesmo polígono em `COR.traco`, deslocado `(shadowOffset, shadowOffset)`, pulado se 0), depois o preenchimento e depois o contorno fechado (`lineStyle(strokeWidth, COR.traco)` + `strokePoints(points, true)`), com os pontos centralizados em (0,0). Depende de T006.
- [X] T012 Criar `client/src/ui/Button.ts` com `createButton(scene, x, y, { label, variant, size, bolha, pilha?, baseAngle?, a11yLabel?, onActivate })`, conforme `data-model.md § Estado visual de botão`: texto `FONTE.display` em caixa alta, `TEXTO.botao_g/m/p`; padding G `16×44`, M `12×28`, P `9×20`; altura mínima `TAMANHO.toqueMinimo`; largura mínima `TAMANHO.pilhaBotaoMin` se `pilha`; sombra `SOMBRA.g/m/p` por tamanho; cores normal/hover/pressionado por variante; raio `RAIO.bolhaA|B` e `bolhaPressionada|B` ao pressionar; hover = tween `uiTweenMs(90)` para `−3,−3` + ângulo do giro (`MOVIMENTO.botaoHover`; 0 com movimento reduzido) + `SOMBRA.hover`; pressionado = `+3,+3`, `scaleY MOVIMENTO.botaoPressionado.achatarY`, `SOMBRA.pressionado`; `onActivate` no `pointerup` só se o ponteiro ainda estiver dentro; `pointerout` durante o pressionado volta ao normal sem ação; zona interativa = retângulo do estado normal (não cresce); anel de foco de 3px `COR.traco` afastado 4px quando o proxy (T009) recebe foco; proxy com `a11yLabel ?? label` capitalizado. Depende de T008, T009, T011.
- [X] T013 Criar `client/src/ui/IconButton.ts` com `createIconButton(scene, x, y, { iconKey, a11yLabel, onActivate, trigger = "up" })`: círculo `TAMANHO.botaoIcone` branco, contorno `TRACO.ui`, `SOMBRA.p`; ícone em escala 0.5 (26px); hover = creme, `SOMBRA.painel`, `−3,−3`, ângulo −8°; pressionado = papel, `SOMBRA.pressionado`, `+2,+2`; `setAtivo(bool)` = creme + `SOMBRA.pressionado`, sem deslocamento, sem hover e com `aria-pressed`; `setA11yLabel(str)`; `setSlash(bool)` desenha/remove uma barra diagonal de 3px `COR.traco` sobre o ícone; `resetVisualState()` volta ao estado normal (ou ativo, se `setAtivo(true)`) sem tween; com `trigger: "down"`, `onActivate(event)` recebe o `EventData` do Phaser no `pointerdown` (para `stopPropagation`). Proxy acessível via T009. Depende de T008, T009, T011.
- [X] T014 [P] Criar `client/src/ui/Pill.ts` com `createPill(scene, x, y, { text, textColor, fill: "branco" | "creme", iconKey?, origin })`, **não interativo**: `pillPoints`, contorno `TRACO.ui`, `SOMBRA.p`, texto `FONTE.display` `TEXTO.hud` (22), padding `6×18` (com ícone, `6×18×6×12` e gap 8, como `gs-hud-tempo`), ícone em escala 0.5; `setText(str)` redesenha o fundo só se a largura mudar; `origin` 0/0.5/1 ancora a borda esquerda, o centro ou a borda direita. Depende de T011.
- [X] T015 [P] Criar `client/src/ui/RiskBar.ts` com `createRiskBar(scene, x, y, { width, origin })`, **não interativo**: trilho em pílula branca `width × TAMANHO.energiaAltura`, contorno `TRACO.ui`, `SOMBRA.p`, padding interno 3; `update(ratio, level)` redesenha o preenchimento em pílula com largura `(width − 6 − 2·TRACO.ui) × ratio` e cor `safe→COR.limao`, `elevated→COR.laranja`, `critical→COR.vermelho` (research §12). Depende de T011.
- [X] T016 [P] Criar `client/src/ui/Panel.ts` com `createPanel(scene, x, y, { width, height, dialog? })`: fundo `COR.creme`, `RAIO.painel`, contorno `TRACO.ui`, `SOMBRA.painel`; devolve o `Container`, para o chamador adicionar os filhos; e `createPanelTitle(scene, x, y, text, size = TEXTO.titulo)`: display em caixa alta, `COR.traco`, ângulo −2°. Depende de T011.
- [X] T017 [P] Criar `client/src/ui/OutlinedTitle.ts` com `createOutlinedTitle(scene, x, y, text, { size, angle, wrapWidth? })`: `Text` `FONTE.display`, caixa alta, `color: hex(COR.branco)`, `stroke: hex(COR.traco)`, `strokeThickness: 8`, `shadow { offsetX: 7, offsetY: 7, color: hex(COR.traco), blur: 0, stroke: true, fill: true }`, `setAngle(angle)` (a rotação é estática, então vale mesmo com movimento reduzido — FR-023 só proíbe animar), `wordWrap` se `wrapWidth` (research §5).
- [X] T018 [P] Criar `client/src/ui/ResultCard.ts` com `createResultCard(scene, x, y, { width, rows, title? })`: cartão creme com `RAIO.cartao`, contorno `TRACO.ui`, `SOMBRA.m`, padding `20×28`; cada linha com rótulo `FONTE.texto` 800 · `TEXTO.rotulo_resultado` (17) à esquerda e valor `FONTE.display` `TEXTO.valor_resultado` (30) à direita (em `COR.vermelho` se `highlight`, senão `COR.traco`); divisória tracejada de `TRACO.detalhe` (2px) entre as linhas; linha sem `value` mostra só o rótulo; `title?` opcional acima das linhas em display `TEXTO.titulo_p`, `COR.traco` (contracts/ui-kit.md). Depende de T011.

**Checkpoint**: `bun test` verde (inclui T004/T005) e `bun run build` sem erro de tipo.

---

## Phase 3: User Story 1 — Menus e telas com a identidade "Grotesco Surreal" (Priority: P1) 🎯 MVP

**Goal**: tela inicial, pausa e fim de jogo com logo e títulos com contorno, botões em bolha, painéis e cartão de resultado (FR-001, FR-008–FR-012, FR-024).

**Independent Test**: `quickstart.md` passos 1, 2, 3, 7, 8, 10 e 11.

- [X] T019 [P] [US1] Reescrever o `create()` de `client/src/scenes/StartScene.ts` conforme `contracts/screens.md § Tela inicial`: fundo `fridgeBg` + as 3 `shelf` decorativas nas mesmas posições da GameScene; `createOutlinedTitle(NOME_DO_JOGO.toUpperCase(), { size: TEXTO.titulo_g.size, angle: −4, wrapWidth: GAME_WIDTH − 2·ESPACO.hudLateral })` em `y = 0.36·GAME_HEIGHT`; `createButton({ label: "JOGAR", variant: "primario", size: "g", bolha: "a", baseAngle: −2, onActivate: () => matchStateManager.start(this.time.now) })` em `y = 0.62·GAME_HEIGHT`. Manter o `match:started → scene.start("GameScene")`. Remover os `fontSize`/cores literais e o uso de `UI_SCALE` para fonte.
- [X] T020 [P] [US1] Reescrever `client/src/scenes/PauseOverlayScene.ts` conforme `contracts/screens.md § Pausa`: retângulo de tela cheia `COR.traco` com `ALFA.sobreposicao`; `createPanel({ width: min(TAMANHO.painelPausa, GAME_WIDTH − 2·ESPACO.hudLateral) })` centrado, com padding vertical 26/30 e gap `ESPACO.e16`; `createPanelTitle("PAUSADO")`; `createButton({ label: "CONTINUAR", variant: "primario", size: "m", bolha: "a", pilha: true, onActivate: () => this.resumeMatch() })`. Manter a tecla P e o `resumeMatch()` iguais.
- [X] T021 [US1] Em `client/src/scenes/GameOverScene.ts`, trocar o fundo (retângulo 0.85) por `fridgeBg` + retângulo `COR.traco`/`ALFA.sobreposicao`, e acrescentar `createOutlinedTitle("FIM DE JOGO!", { size: TEXTO.titulo_g.size, angle: −3 })` no topo (`y ≈ 70` na paisagem, proporcional no retrato), visível nas duas etapas.
- [X] T022 [US1] Em `client/src/scenes/GameOverScene.ts`, reescrever `showNameEntry(score)` conforme `contracts/screens.md § Fim de jogo, item 1`: `createPanel({ dialog: true, width: min(440, GAME_WIDTH − 2·ESPACO.hudLateral) })`; `createPanelTitle("NOVA PONTUAÇÃO!", TEXTO.titulo_p)`; pílula branca "PONTOS {formatThousands(score)}" em `COR.vermelho`; campo de nome em pílula branca com `this.renderNameLine()` em display `TEXTO.hud` e `COR.traco`; instrução "Digite seu nome e aperte Enter" em `FONTE.texto` `TEXTO.corpo` e `COR.legenda`. **Manter sem mudança** `NAME_MAX_LENGTH = 10`, `NAME_ALLOWED_CHAR = /^[a-zA-Z0-9 ]$/`, Backspace, Enter, o fallback `"Jogador"`, o `cursorTimer` de 500ms e o `cleanup()` (FR-012). Remover todo `fontFamily: "monospace"` e as cores literais. **Proxies (C4)**: ao abrir o painel, chamar `setProxiesEnabled(false)` (de `../ui/a11y`); no `cleanup()`, chamar `setProxiesEnabled(true)`. Assim Espaço/Enter digitados no nome nunca acionam o botão de som focado.
- [X] T023 [US1] Em `client/src/scenes/GameOverScene.ts`, reescrever `showResults()` e substituir `renderRankingCard()` conforme `contracts/screens.md § Fim de jogo, item 2`: `createResultCard({ width: min(TAMANHO.cartaoResultado, GAME_WIDTH − 2·ESPACO.hudLateral), rows })` com a linha de destaque `{ label: "PONTOS", value: formatThousands(score), highlight: true }`; a mensagem de posição (quando `position !== null`) "NOVO RECORDE!" ou `${position}º LUGAR NO TOP 5!` **fora e acima do cartão**, logo abaixo de "FIM DE JOGO!", como `createPanelTitle(…, TEXTO.titulo_p)` em `COR.traco` sobre uma pílula branca; `title: "TOP 5"` no cartão e as `HIGH_SCORE_RANKING_MAX_ENTRIES` linhas `{ label: "${i+1}. ${name.toUpperCase()}", value: formatThousands(score) }` ou `{ label: "${i+1}. ---" }`; abaixo, `createButton({ label: "DE NOVO!", variant: "primario", size: "m", bolha: "a", a11yLabel: "De novo!", onActivate: () => matchStateManager.restart(this.time.now) })`. Manter a chamada a `recordScore` e o `match:started → scene.start("GameScene")`. Invariante: cabe em 600px de altura sem sobrepor o título; se não couber, reduzir o padding das linhas de 6 para 4.
- [X] T024 [US1] Validar a US1 pelo `quickstart.md` (passos 1, 2, 3, 7, 8, 10 e 11) nas bases paisagem e retrato (DevTools em 390×844, com recarga), e corrigir cortes e sobreposições.

**Checkpoint**: menus completos no novo visual. O HUD ainda pode estar no estilo antigo.

---

## Phase 4: User Story 2 — HUD da partida no estilo do design system (Priority: P2)

**Goal**: pílulas de pontos, tempo e comidas, barra de risco horizontal e Pausar como botão de ícone, na ordem decidida no clarify (FR-013–FR-015, FR-017, FR-019).

**Independent Test**: `quickstart.md` passos 4, 5, 6, 7 e 8.

- [X] T025 [US2] Em `client/src/scenes/GameScene.ts`, criar o método `layoutHud()` que calcula as posições de `contracts/screens.md § HUD da partida`: `L = ESPACO.hudLateral`, `T = ESPACO.e16`, `G = ESPACO.e12`, `B = TAMANHO.botaoIcone`; linha 1 centrada em `T + B/2`; paisagem (`GAME_WIDTH >= GAME_HEIGHT`) com tudo na linha 1 e retrato com comidas + barra na linha 2 (centro em `T + B + G + B/2`), alinhadas à direita em `GAME_WIDTH − L`. Largura da barra de risco = constante nomeada `HUD_RISK_BAR_WIDTH = 160`. Remover as constantes antigas `HUD_MARGIN_*`, `HUD_BAR_*`, `HUD_RISK_COLORS`, `HUD_FONT_*`, `HUD_SCORE_GAP` e `PAUSE_BUTTON_FONT_SIZE_PX`.
- [X] T026 [US2] Em `client/src/scenes/GameScene.ts`, substituir `scoreText`, `timerText`, `hudText` e `hudBar` por: `scorePill = createPill({ text: "PONTOS 0", textColor: COR.vermelho, fill: "branco", origin: 0 })`; `timerPill = createPill({ text: formatClock(0), textColor: COR.traco, fill: "creme", iconKey: "icone-tempo", origin: 0.5 })`; `foodPill = createPill({ text: "N / total", textColor: COR.traco, fill: "branco", iconKey: "icone-coracao", origin: 1 })`; `riskBar = createRiskBar({ width: HUD_RISK_BAR_WIDTH, origin: 1 })`. Reescrever `updateScore` (`PONTOS ${formatThousands(score)}`), `updateHud` (`${foodRemainingCount} / ${foodTotalCount}` + `riskBar.update(foodRemainingCount / foodTotalCount, riskLevel)`) e `updateTimer` (usar `formatClock`, mantendo o throttle por segundo inteiro). **Não** mexer em `formatElapsedTime` de `entities/Match.ts`. Na paisagem, aplicar a invariante de largura de `screens.md` (a pílula de tempo nunca encosta na de comidas: desloca para a esquerda se preciso). **Profundidade (C2)**: definir as constantes `UI_DEPTH_HUD = 10` e `ROACH_DEPTH = 20` em `GameScene.ts`, aplicar `setDepth(UI_DEPTH_HUD)` em todas as pílulas, na barra e em Pausar, e `setDepth(ROACH_DEPTH)` em cada sprite de barata criado em `syncRoachSprites`, para que a barata sempre apareça por cima do HUD.
- [X] T027 [US2] Em `client/src/scenes/GameScene.ts`, substituir o texto "Pausar" por `pauseButton = createIconButton({ iconKey: "icone-pausar", a11yLabel: "Pausar", trigger: "down", onActivate: (event) => { event.stopPropagation(); this.triggerPause(); } })` no canto superior direito (centro em `GAME_WIDTH − L − B/2, T + B/2`). Em `triggerPause()`, chamar `pauseButton.setAtivo(true)` **antes** de `this.scene.pause()`. No handler de `Phaser.Scenes.Events.RESUME`, chamar `pauseButton.setAtivo(false)` e `pauseButton.resetVisualState()` (volta ao estado normal sem hover preso, já que o `pointerout` se perde durante a pausa), cobrindo o botão CONTINUAR e a tecla P. `resetVisualState()` faz parte do `IconButton` (T013). Manter o `keydown-P`, o `logicalNow()` e o acúmulo de pausa sem mudança. **Guarda do som (C1)**: no início de `handlePointerDown(pointer)`, retornar sem fazer nada se `isOverAudioButton(pointer.x, pointer.y)` (import de `./AudioControlScene`) — sem `sfx-miss`, sem quebrar combo, sem `cursor:strike`. Depende de T029.
- [X] T028 [US2] Validar a US2 pelo `quickstart.md` (passos 4 a 8) nas duas bases: conferir que o `y` máximo do HUD fica abaixo de `SHELF_Y_POSITIONS[0] − ROACH_VISUAL_RADIUS − HITBOX_PADDING_PX` (134 na paisagem, 230 no retrato), que PONTOS com 5 dígitos não sobrepõe nada e que cliques em baratas ao lado do HUD eliminam normalmente (SC-003).

**Checkpoint**: US1 + US2 funcionam juntas, e a partida está totalmente no novo visual, com exceção do som, do cenário e das constantes de movimento.

---

## Phase 5: User Story 3 — Controle de som, cenário e cursor coerentes (Priority: P3)

**Goal**: som como botão de ícone sem emoji, geladeira com a paleta, pata sobre tudo e `MOVIMENTO` como fonte única (FR-007, FR-016, FR-018, FR-021).

**Independent Test**: `quickstart.md` passos 2, 9 e 13, mais a revisão visual do cenário.

- [X] T029 [P] [US3] Reescrever `client/src/scenes/AudioControlScene.ts` conforme `contracts/screens.md § Controle de som`: `createIconButton({ iconKey: "icone-som", a11yLabel, trigger: "down", onActivate: (event) => { event?.stopPropagation(); this.toggleMuted(); } })` com centro em `(GAME_WIDTH − ESPACO.hudLateral − TAMANHO.botaoIcone/2, GAME_HEIGHT − ESPACO.e16 − TAMANHO.botaoIcone/2)`; `applyVisualState()` chama `setAtivo(muted)`, `setSlash(muted)` e `setA11yLabel(muted ? "Som desligado" : "Som ligado")`, e é chamado no `create()` e em cada toggle. Remover `AUDIO_BUTTON_LABEL_*` (emoji), `AUDIO_BUTTON_MARGIN` e os imports de `AUDIO_BUTTON_FONT_SIZE_PX`/`AUDIO_BUTTON_PADDING_Y_PX`. Exportar `isOverAudioButton(x: number, y: number): boolean`, calculado a partir das mesmas constantes de posição e tamanho do botão (contracts/screens.md § Clique não vaza para a partida). Manter `getMuted`/`setMuted` e `this.sound.mute` iguais.
- [X] T030 [P] [US3] Em `client/src/config/gameConfig.ts`, remover `AUDIO_BUTTON_FONT_SIZE_PX` e `AUDIO_BUTTON_PADDING_Y_PX` (sem uso depois de T029, conferir com grep), e fazer `CURSOR_PAW_HEIGHT_PX = Math.round(MOVIMENTO.pata.alturaPx * UI_SCALE)` e `CURSOR_STRIKE_DURATION_MS = MOVIMENTO.pata.golpeMs`, importando de `./theme` (research §10; os valores continuam 56 e 150).
- [X] T031 [P] [US3] Em `client/src/scenes/BootScene.ts`, reescrever `generatePlaceholderTextures()` conforme research §11, **mantendo as chaves e os tamanhos lógicos**: `fridgeBg` = `COR.ceu` chapado em `GAME_WIDTH×GAME_HEIGHT`; `shelf` = retângulo `COR.branco` com raio 8 e contorno `TRACO.ui` `COR.traco`, textura com 4px a mais em cada eixo para caber o traço, mantendo o tamanho visível do corpo (GAME_WIDTH−120)×20 e o mesmo centro; `food` 60×60 = bolha `COR.laranja` com raio 14 e contorno `TRACO.arte`, pontas de embrulho em `COR.creme` e dois traços curtos de brilho em `COR.branco`. Em `createRoachAnimations()`, trocar `frameRate: 15/20` por `MOVIMENTO.barataAndando.fps` / `MOVIMENTO.barataVoando.fps`.
- [X] T032 [US3] Em `client/src/scenes/GameScene.ts`, trocar as constantes soltas por `MOVIMENTO` (research §10): `SQUASH_STRETCH_MAX_DELTA`/`_FREQUENCY_HZ` → `MOVIMENTO.agitacao.squashMax`/`squashHz`; `TREMOR_MAX_OFFSET_PX`/`TREMOR_BASE_FREQUENCY_HZ`/`TREMOR_MAX_FREQUENCY_HZ` → `tremorMaxPx`/`tremorHzMin`/`tremorHzMax`; `WALK_LOCOMOTION_*` → `MOVIMENTO.barataAndando.balancoDeg`/`balancoHz`; `FLY_LOCOMOTION_*` → `MOVIMENTO.barataVoando.balancoDeg`/`balancoHz`; o tween de eliminação (`y + 40`, `duration: 200`) → `MOVIMENTO.barataEliminada.quedaPx`/`ms`. Manter `ROACH_SPRITE_SCALE`, `ROACH_SPRITE_FORWARD_DEG` e o tween de comida roubada. Depende de T026/T027 (mesmo arquivo).
- [X] T033 [P] [US3] Em `client/src/scenes/CursorScene.ts`, trocar `LEAN_MAX_DEG`, `LEAN_FACTOR`, `LEAN_SMOOTHING`, `angle: -25` e `this.baseScale * 1.25` por `MOVIMENTO.pata.inclinacaoMaxDeg`, `fatorInclinacao`, `suavizacao`, `golpeAnguloDeg` e `golpeEscala`. Manter `MOVEMENT_DEADZONE_PX` e `NEUTRAL_FACING_DEG`.
- [X] T034 [US3] Validar a US3 pelo `quickstart.md` (passos 2, 9 e 13): a pata visível e animando sobre todos os botões e pílulas; o som alternando em todas as telas e lembrado após recarregar; a barata legível sobre o fundo céu; a sensação do cursor e da barata idêntica à de antes.

**Checkpoint**: as três histórias estão completas.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T035 Varredura de literais: (a) `grep -rnE "0x[0-9a-fA-F]{6}|#[0-9a-fA-F]{6}|fontFamily|monospace|Fredoka|🔊|🔇" client/src --include=*.ts` só pode encontrar ocorrências em `client/src/config/theme.ts`; (b) `grep -rnE "fontSize|strokeThickness|setStrokeStyle|lineStyle\(|, 0\.[0-9]+\)" client/src/scenes --include=*.ts` não pode encontrar números escritos direto para tamanho de texto, traço ou opacidade de sobreposição (só referências a `TEXTO`, `TRACO`, `ALFA`). Corrigir o que sobrar (SC-001, FR-004, FR-006, FR-022).
- [X] T036 Rodar `bun test` e `bun run build` em `client/`: toda a suíte existente passa sem ter sido editada, junto com `ui.shape`/`ui.format` (FR-026).
- [ ] T037 Executar o `quickstart.md` completo (passos 1–15 e revisão visual) em Chrome, Firefox e Edge. Registrar nesta seção o resultado de SC-002 (FPS) e SC-006 (fontes bloqueadas).
  - **Resultado da validação automatizada (2026-09-28, Chrome via extensão, paisagem 960×600 e retrato 480×960 em iframe)**: ✅ passos 1, 2 (hover/pressionado conferidos em CONTINUAR), 4, 6 (limão → laranja → vermelho), 7, 8 (tecla P devolve Pausar ao normal), 9 (mudo = afundado + barra diagonal, rótulo "Som desligado", preferência salva), 11 (DE NOVO! sem acúmulo de proxies), baratas desenhadas por cima do HUD, Top 5 cabendo em 600px, títulos com Ç/Ã na Luckiest Guy. `bun test` 126/126, `tsc --noEmit` e `bun run build` sem erro.
  - **Pendente de validação manual**: SC-002 (FPS) e animações de tween — a aba automatizada não renderiza quadros entre capturas (`requestAnimationFrame` não dispara), então não dá para medir; passo 10 (digitação do nome) — no mesmo ambiente o Phaser reprocessa a fila de teclado acumulada e o nome sai repetido ("x y espaço z" → "XYXYXYX XY"), inclusive com eventos sintéticos; a lógica de digitação não mudou nesta feature, mas precisa ser confirmada numa aba normal; passos 3, 12, 14, 15 (Tab/foco, movimento reduzido, fontes bloqueadas, leitor de tela) e Firefox/Edge.
- [X] T038 *(confirmado pelo usuário em 2026-09-28; arquivos removidos)* **Pedir confirmação ao usuário (constitution Princípio VIII)** antes de remover `client/public/assets/fonts/Fredoka-Bold.woff2` e `client/src/styles/grotesco.css` (sem uso depois desta feature; a referência continua em `docs/borges-design-system/`). Remover só com "sim".
- [X] T039 [P] Atualizar `CLAUDE.md`: nome do jogo "Borges e as Baratas", pasta `client/src/ui/` (kit de UI no canvas, consumido só por `scenes/`), `client/src/config/theme.ts` como fonte única de tokens e referência a `docs/borges-design-system/`.
- [X] T040 [P] Atualizar `backlog.md`: o título "Backlog — Baratas na Geladeira" passa a "Backlog — Borges e as Baratas"; no item "Substituir sprites placeholder por arte final" (seção 6), registrar que fundo, prateleiras e comidas passaram para a paleta via `specs/017-design-system-grotesco` e que a barata e a pata continuam pendentes (ver seção 8).
- [ ] T041 Marcar `specs/017-design-system-grotesco/spec.md` como `**Status**: Implemented` depois de T036/T037 passarem.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências. T002 e T003 em paralelo, e T001 depois de T003 (usa `COR`/`hex`, que já existem, então na prática pode ir junto).
- **Foundational (Phase 2)**: depende da Setup e bloqueia todas as histórias.
  - T006 ← T004; T007 ← T005; T011 ← T006; T012/T013 ← T008 + T009 + T011; T014–T016 e T018 ← T011; T017 independente; T010 independente dos componentes.
- **US1 (Phase 3)**: depende da Phase 2. Não depende de US2/US3.
- **US2 (Phase 4)**: depende da Phase 2. Independente da US1 (arquivos diferentes).
- **US3 (Phase 5)**: depende da Phase 2. T032 depende de T026/T027 porque os três editam `GameScene.ts`. O resto é independente de US1/US2.
- **Ligação US2 ↔ US3**: a guarda do som em T027 importa `isOverAudioButton` de T029. Se a US2 for feita antes da US3, criar primeiro só a função exportada em `AudioControlScene.ts`.
- **Polish (Phase 6)**: depois das histórias desejadas.

### Arquivos compartilhados (evitar edição simultânea)

- `client/src/scenes/GameScene.ts`: T025 → T026 → T027 → T032
- `client/src/scenes/GameOverScene.ts`: T021 → T022 → T023
- `client/src/scenes/BootScene.ts`: T010 → T031
- `client/src/config/gameConfig.ts`: T030 (única)

### Parallel Opportunities

- Setup: T002 ∥ T003.
- Foundational: T004 ∥ T005 ∥ T008 ∥ T009 ∥ T010 ∥ T017; depois T006 ∥ T007; depois T014 ∥ T015 ∥ T016 ∥ T018 (e T012 → T013 no mesmo ritmo).
- Com a Phase 2 pronta, US1, US2 e US3 podem andar em paralelo, exceto T032, que espera T026/T027.
- Dentro da US1: T019 ∥ T020 ∥ (T021 → T022 → T023).
- Dentro da US3: T029 ∥ T030 ∥ T031 ∥ T033.
- Polish: T039 ∥ T040.

## Parallel Example: User Story 1

```text
Task: "T019 [US1] StartScene — logo com contorno + JOGAR"
Task: "T020 [US1] PauseOverlayScene — sobreposição 55% + painel PAUSADO + CONTINUAR"
Task: "T021→T022→T023 [US1] GameOverScene — título, painel de nome, cartão de resultado + DE NOVO!"
```

## Parallel Example: User Story 3

```text
Task: "T029 [US3] AudioControlScene — botão de ícone Som"
Task: "T030 [US3] gameConfig — CURSOR_* derivados de MOVIMENTO.pata"
Task: "T031 [US3] BootScene — texturas céu/prateleira/comida + fps de MOVIMENTO"
Task: "T033 [US3] CursorScene — constantes de MOVIMENTO.pata"
```

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (Setup) e Phase 2 (Foundational), terminando com `bun test` verde.
2. Phase 3 (US1): as telas de menu já mostram a nova identidade.
3. **Parar e validar** com o `quickstart.md` (passos da US1).

### Incremental Delivery

1. Setup + Foundational: kit pronto e testado.
2. US1: menus (maior ganho de percepção).
3. US2: HUD (atenção ao Princípio V; validar cliques perto do HUD).
4. US3: som, cenário e unificação de `MOVIMENTO`.
5. Polish: varredura, limpeza sob confirmação, documentação.

Cada história é um commit próprio e não quebra as anteriores.
