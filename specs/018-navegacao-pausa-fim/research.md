# Research: Navegação completa da pausa e do fim de jogo

**Feature**: `specs/018-navegacao-pausa-fim` | **Date**: 2026-09-28

## §1. Como encerrar uma partida em andamento (domínio)

**Decision**: novo método `MatchStateManager.forfeit(now: number): boolean`. Se `status ===
"playing"`, define `endedAt = now` e `status = "lost"`, emite `match:lost` com o snapshot e
devolve `true`. Em qualquer outro estado, não faz nada e devolve `false` (idempotente).
`MatchStatus` **não** ganha valor novo.

**Rationale**:
- FR-006 (clarify: opção A) pede que a partida encerrada siga exatamente o fluxo de uma derrota.
  Emitir o mesmo `match:lost` faz o handler que já existe em `GameScene` parar o som de voo e
  abrir a `GameOverScene`, que pede nome e grava no Top 5, sem nenhuma mudança nessas cenas.
- `elapsedMs` já congela em `endedAt`, então tempo e pontuação ficam como estavam (FR-005,
  SC-005).
- `tick()` já ignora partidas fora de `"playing"`. Depois do `forfeit` nada mais nasce nem é
  roubado.
- A regra fica no domínio, testável sem Phaser (Princípios I e II).

**Alternatives considered**:
- *Status novo `"forfeited"`*: nenhuma tela trata os dois casos de forma diferente (a Assumption
  diz que o título é o mesmo "FIM DE JOGO!"). Criar o status agora seria antecipar requisito
  (Princípio IV). Rejeitado.
- *Encerrar só na camada de cena (ir direto para `GameOverScene`)*: a partida continuaria
  `"playing"` no domínio, o snapshot teria `endedAt = null` e o cronômetro não congelaria.
  Espalharia regra em handler de UI (Princípio II). Rejeitado.

## §2. Qual `now` usar ao encerrar (tempo pausado não conta)

**Decision**: `GameScene.triggerPause()` passa `{ pausedAtLogicalMs: this.logicalNow() }` como
dado de `scene.launch("PauseOverlayScene", data)`. A overlay usa esse valor em
`matchStateManager.forfeit(pausedAtLogicalMs)`.

**Rationale**: `logicalNow()` é o relógio da partida que já desconta os intervalos pausados (spec
009). Capturá-lo no instante da pausa dá exatamente o tempo que o HUD mostrava (SC-005). A
overlay não precisa conhecer o relógio interno da `GameScene`.

**Alternatives considered**: `this.scene.get("GameScene").logicalNow()` na overlay, que exigiria
tornar o método público e acoplar as cenas; um evento global que a `GameScene` pausada tratasse,
que é mais indireto. Rejeitados.

## §3. REINICIAR a partir da pausa

**Decision**: na overlay, `this.sound.stopAll()`, depois `matchStateManager.restart(this.time.now)`
e por fim `this.scene.start("GameScene")`. O `scene.start` de um `ScenePlugin` encerra a cena que
chama (a overlay) e reinicia a `GameScene`, que está pausada e é recriada do zero.

**Rationale**:
- `restart()` já existe e já é coberto por `matchStateManager.restart.test.ts`, garantindo o
  estado inicial (FR-003, SC-004). A partida descartada nunca emite `match:lost`, então não pede
  nome nem entra no ranking (FR-004).
- O `Clock` de todas as cenas usa o tempo do jogo, e a overlay está ativa (o relógio dela anda),
  então `this.time.now` é o "agora" certo para a partida nova. É o mesmo padrão de `StartScene` e
  `GameOverScene`.
- O `create()` da `GameScene` já zera o acúmulo de pausa, para o som de voo e para qualquer
  overlay pendurada.

## §4. Sons ao sair da pausa

**Decision**: antes de REINICIAR ou ENCERRAR, a overlay chama `this.sound.stopAll()`.

**Rationale**: a pausa chamou `sound.pauseAll()`. Sem um `stopAll`, as instâncias pausadas (o loop
`sfx-fly` e algum efeito curto que estivesse tocando) ficariam penduradas e poderiam voltar num
`resumeAll` futuro (FR-012). `stopAll` não mexe em `sound.mute`, então a preferência de som
continua valendo. MENU parte do fim de jogo, onde o voo já foi parado pelo handler de
`match:lost`, então não precisa de nada novo.

## §5. Diálogo de confirmação (FR-007)

**Decision**: novo componente `createDialog(scene, x, y, opts)` em `client/src/ui/Dialog.ts`,
seguindo o componente Diálogo do design system: painel creme com largura
`min(TAMANHO.dialogo = 400, GAME_WIDTH − 2·hudLateral)`, título em display `TEXTO.titulo_p` (28),
texto em Baloo 2 `TEXTO.corpo` (600 · 16) e dois botões P lado a lado (cancelar = terciário bolha
B à esquerda; confirmar = primário bolha A à direita). Devolve `{ destroy() }`.

A `PauseOverlayScene` vira uma pequena máquina de estados (`"painel" | "confirmarReiniciar" |
"confirmarEncerrar"`): a troca de estado destrói o conteúdo atual (botões, textos, painel,
incluindo os proxies de acessibilidade) e monta o próximo. A sobreposição escura continua a mesma.

**Rationale**: reconstruir é mais simples e mais seguro que esconder e desabilitar zonas e proxies
(FR-013: nada de botão invisível ativo). O custo é desprezível, porque só acontece por clique.

**Alternatives considered**: esconder o painel com `setVisible(false)` e desligar as zonas, o que
exigiria API nova no kit para desabilitar proxies. Rejeitado.

## §6. Proteção contra clique duplo (FR-014)

**Decision**: cada cena de navegação (overlay e fim de jogo) mantém uma flag `leaving`. A primeira
ação de saída (REINICIAR confirmado, ENCERRAR confirmado, DE NOVO!, MENU) liga a flag, e as
chamadas seguintes são ignoradas. Na overlay, os botões de troca de estado (abrir ou cancelar
diálogo) também ficam sem efeito depois de `leaving`. `forfeit()` e `restart()` já seriam
seguros, porque `forfeit` é idempotente, mas a flag evita `scene.start` duplicado.

## §7. MENU e botões lado a lado no fim de jogo

**Decision**:
- MENU chama `this.scene.start("StartScene")`. Não precisa de nada no domínio: a partida já está
  `"lost"`, e o JOGAR da `StartScene` chama `matchStateManager.start()`.
- O kit ganha `Button.setPosition(x, y)`, que move o container **e** a zona de clique juntos e
  atualiza a posição base usada pelo hover. Assim o fim de jogo cria os dois botões, mede as
  larguras e só então posiciona: lado a lado e centralizados com vão de `ESPACO.e16` se
  `larguraA + e16 + larguraB ≤ GAME_WIDTH − 2·hudLateral`; senão, empilhados com DE NOVO! em cima
  (FR-008).
- O orçamento de altura na paisagem (600px) não muda, porque a linha continua com a altura de um
  botão M.

## §8a. Foco do teclado nas trocas de estado (FR-015a)

**Decision**: a origem teclado é detectada por `isProxyFocused()` no momento da ação (o proxy
focado é o que o jogador acionou com Enter/Espaço). Só nesse caso o foco é movido: ao abrir o
diálogo, para o **cancelar** (CONTINUAR); ao cancelar, para o botão da pausa que abriu o diálogo.

**Rationale**: remontar a tela destrói o proxy focado, e o foco cairia no `body`. Focar o botão
seguro evita que um Espaço (que dispara `click` no `keyup`) ou um Enter repetido confirme uma ação
destrutiva sem querer. Com mouse, focar mostraria um anel de foco inesperado, por isso não se move.

## §8. Tecla P com o diálogo aberto (FR-007b)

**Decision**: o handler `keydown-P` da overlay só chama `resumeMatch()` quando o estado é
`"painel"`.
