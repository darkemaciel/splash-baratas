# Contract: Composição das telas e do HUD

Coordenadas no espaço lógico do jogo (antes do `Scale.FIT`). `L` = `ESPACO.hudLateral` (20),
`T` = `ESPACO.e16` (16), `G` = `ESPACO.e12` (12), `B` = `TAMANHO.botaoIcone` (52).

## HUD da partida (`GameScene`)

| Item | Paisagem 960×600 | Retrato 480×960 | Interativo |
|---|---|---|---|
| Pílula PONTOS (vermelho, branca) | esquerda, `x = L`, linha 1 | igual | não |
| Pílula tempo (creme, ícone relógio, `m:ss`) | centro, `x = GAME_WIDTH/2`, linha 1 | igual | não |
| Botão Pausar | direita, borda em `GAME_WIDTH − L`, linha 1 | igual | **sim** (`pointerdown` + `stopPropagation`) |
| Barra de risco 160×28 | à esquerda de Pausar, `G` de distância, linha 1 | linha 2, borda direita em `GAME_WIDTH − L` | não |
| Pílula comidas (coração, `N / total`) | à esquerda da barra, `G` de distância, linha 1 | linha 2, à esquerda da barra | não |

- Linha 1: centro vertical em `T + B/2` (42). Linha 2 (só retrato): centro em `T + B + G + B/2`
  (106), mas os itens da linha 2 têm altura menor que `B` e ficam centrados nesse eixo.
- **Invariante de folga**: o `y` máximo do HUD é menor que `SHELF_Y_POSITIONS[0] −
  ROACH_VISUAL_RADIUS − HITBOX_PADDING_PX` nas duas bases (68 < 134 e ~124 < 230).
- **Invariante de largura (paisagem)**: a borda direita da pílula de tempo não pode passar da
  borda esquerda da pílula de comidas menos `G`, com pontuação de 5 dígitos. Se passar, a pílula de
  tempo é deslocada para a esquerda o necessário (nunca sobrepõe).
- **Profundidade**: pílulas, barra e Pausar ficam abaixo das baratas (ver `ui-kit.md §
  Profundidade`). As baratas nunca somem atrás do HUD.
- Pausa ativa: ao pausar, `pauseButton.setAtivo(true)`. No evento `RESUME` da `GameScene`, volta
  para `false` e o botão volta ao estado normal (sem hover preso, já que o `pointerout` se perde
  enquanto o input da cena está desligado), tanto pelo botão quanto pela tecla P (Edge Case).

## Controle de som (`AudioControlScene`)

- `createIconButton` com o ícone `som`, canto inferior direito: centro em
  `(GAME_WIDTH − L − B/2, GAME_HEIGHT − T − B/2)`.
- Mudo: `setAtivo(true)` + barra diagonal de 3px sobre o ícone, e `setA11yLabel("Som desligado")`.
  Ligado: `setAtivo(false)` e `"Som ligado"`.
- **Invariante**: o retângulo do botão não cruza a faixa de clique da prateleira inferior
  (`SHELF_Y_POSITIONS[2] ± (ROACH_VISUAL_RADIUS + HITBOX_PADDING_PX)`), que termina em 506
  (paisagem) e 794 (retrato); o botão começa em 532 e 892.
- **Clique não vaza para a partida (FR-019)**: um clique no botão de som durante a partida
  **não** pode chegar ao `handlePointerDown` da `GameScene` (sem `sfx-miss`, sem quebrar combo,
  sem golpe da pata). O botão de som usa `trigger: "down"` e chama `event.stopPropagation()`.
  Como ele vive em outra cena, a `GameScene` também ignora `pointerdown` cujo ponto caia no
  retângulo do botão de som (`isOverAudioButton(x, y)`, exportado por `AudioControlScene` a partir
  das mesmas constantes de posição), garantindo o comportamento seja qual for a propagação entre
  cenas do Phaser.

## Tela inicial (`StartScene`)

- Fundo `fridgeBg` (céu) e prateleiras decorativas.
- `createOutlinedTitle("BORGES E AS BARATAS", titulo_g, −4°)` centrado em `y ≈ 0.36·GAME_HEIGHT`.
  No retrato, se a largura passar de `GAME_WIDTH − 2L`, o título quebra em duas linhas
  ("BORGES E AS" / "BARATAS").
- `createButton("JOGAR", primario, g, bolha a, baseAngle −2°)` em `y ≈ 0.62·GAME_HEIGHT`.
  `onActivate` chama `matchStateManager.start(now)`.

## Pausa (`PauseOverlayScene`)

- Retângulo de tela cheia `COR.traco` com `ALFA.sobreposicao` (0.55).
- `createPanel(width = min(TAMANHO.painelPausa, GAME_WIDTH − 2L))` centrado. O título "PAUSADO" é
  título de painel (display `titulo`, 44, em `COR.traco`, girado −2°, como `gs-painel__titulo`), e
  não título com contorno. Abaixo dele, `createButton("CONTINUAR", primario, m, bolha a, pilha)`.
- Tecla P e botão chamam o mesmo `resumeMatch()`.

## Fim de jogo (`GameOverScene`)

Fundo: `fridgeBg` + sobreposição de 0.55. Título `createOutlinedTitle("FIM DE JOGO!", titulo_g,
−3°)` no topo (`y ≈ 70` na paisagem), presente nas duas etapas.

1. **Entrada de nome**: `createPanel(dialog)` com largura `min(440, GAME_WIDTH − 2L)`. Dentro:
   título de painel "NOVA PONTUAÇÃO!" (display `titulo_p`), "PONTOS 1.250" (display `hud`, em
   vermelho sobre pílula branca), campo de nome (pílula branca com o texto em display `hud`,
   `COR.traco`, e o cursor `_` piscando a cada 500ms) e a instrução em Baloo 2 `corpo` com
   `COR.legenda`. As regras de teclado não mudam (FR-012). Ao abrir o painel,
   `setProxiesEnabled(false)`; ao confirmar o nome, `setProxiesEnabled(true)`.
2. **Resultado** (de cima para baixo, logo abaixo do título):
   - Pílula branca "PONTOS {formatThousands(score)}" em `COR.vermelho` (pontuação final em destaque).
   - Quando `position !== null`, pílula creme com "NOVO RECORDE!" ou "{n}º LUGAR NO TOP 5!" em
     `COR.traco`.
   - `createResultCard({ title: "TOP 5", width: min(TAMANHO.cartaoResultado, GAME_WIDTH − 2L) })` com
     5 linhas: rótulo "{i}. NOME" e valor `formatThousands`, ou "{i}. ---" sem valor.
   - Abaixo: `createButton("DE NOVO!", primario, m, bolha a)`. `onActivate` chama
     `matchStateManager.restart(now)`.
   - *Ajuste de implementação*: a versão anterior deste contrato punha "PONTOS" como linha de
     destaque dentro do cartão, mas na paisagem (600px) título + cartão + botão estouravam a
     altura. A pontuação foi para a pílula acima do cartão, que ficou só com o Top 5.
- **Invariante**: o conteúdo cabe em 600px de altura (paisagem) sem sobrepor o título. Se não
  couber, as linhas do ranking usam `rotulo_resultado` com `padding` de 4 em vez de 6.
