# Research: Design System "Grotesco Surreal" em todo o jogo

**Feature**: `specs/017-design-system-grotesco` | **Date**: 2026-09-27

## §1. Desenhar a interface no canvas (Phaser) ou em DOM por cima

**Decision**: tudo no canvas, com GameObjects do Phaser (`Graphics`, `Text`, `Image`, `Container`),
num pequeno kit de componentes em `client/src/ui/` que reproduz as regras de `grotesco.css`. O
container de DOM do Phaser (`dom: { createContainer: true }`) **não** é ligado.

**Rationale**:
- **Cursor (FR-021)**: a pata é um `Image` desenhado por `CursorScene` dentro do canvas. O
  container de DOM do Phaser fica *acima* do canvas, então qualquer botão ou pílula em DOM cobriria
  a pata. Além disso, o `pointermove` que move a pata é ouvido no canvas: sobre um elemento DOM a
  pata congelaria. Consertar isso exigiria reescrever o cursor como elemento DOM, que é outra
  feature.
- **Clique (Princípio V, FR-019)**: com tudo no canvas, a entrada continua passando pelo mesmo Input
  Plugin do Phaser. `event.stopPropagation()` no botão Pausar, que já existe, segue funcionando, e
  nenhum elemento decorativo captura clique (pílulas não recebem `setInteractive`).
- **Pausa**: `scene.pause()` desliga o input da `GameScene` sozinho. Em DOM, os botões da cena
  pausada continuariam clicáveis e precisariam de um desligamento manual.
- **Base retrato**: o canvas já escala com `Scale.FIT`. Elementos DOM precisariam acompanhar a
  escala por conta própria.

**Alternatives considered**:
- *DOM com `grotesco.css`, como no `LEIA-ME.md`*: tem acabamento perfeito de CSS (bolhas elípticas,
  `:hover`, foco), mas quebra FR-021 e aumenta o risco para FR-019. Rejeitado.
- *Híbrido (menus em DOM, HUD no canvas)*: a pata também precisa ficar sobre os menus. Rejeitado
  pelo mesmo motivo.

## §2. CSS e fontes

**Decision**: importar só `client/src/styles/tokens.css` em `client/index.ts`, porque ele traz os
`@font-face` das fontes locais. `grotesco.css` **não** é importado, pois nenhuma classe `gs-*` é usada
no canvas. Remover de `index.html` o `@font-face` da Fredoka e trocar o fundo da página
(`#0d0d0d`) por `var(--cor-traco)`. O `<title>` passa a ser "Borges e as Baratas".

**Limpeza (pede confirmação, constitution Princípio VIII)**: `client/public/assets/fonts/Fredoka-Bold.woff2`
e `client/src/styles/grotesco.css` ficam sem uso. A sugestão é removê-los de `client/` (o
`grotesco.css` continua como referência em `docs/borges-design-system/`), mas só com o "sim" do
usuário no momento da implementação.

**Rationale**: evita CSS morto no bundle e mantém uma única origem de `@font-face` (tokens.css),
igual à do design system.

## §3. Espera pelas fontes

**Decision**: `BootScene.loadFonts()` substitui `loadHudFont()` e faz
`Promise.race([Promise.all([...]), timeout(1000)])` com
`document.fonts.load('400 28px "Luckiest Guy"')` e `document.fonts.load` de Baloo 2 nos pesos
600, 700 e 800. Os pesos precisam bater com os `@font-face`, como a spec 005 já aprendeu.

**Rationale**: o texto do canvas não se redesenha quando a fonte chega depois. Com o teto de 1s, o
jogo nunca trava (FR-003, SC-006). O fallback é a pilha `FONTE.display`/`FONTE.texto`.

## §4. Forma de bolha e cantos assimétricos no Graphics

**Decision**: a função pura `bubblePoints(width, height, radii, segmentsPerCorner = 8)` em
`client/src/ui/shape.ts` recebe os raios no formato CSS `"h1 h2 h3 h4 / v1 v2 v3 v4"`, em % ou px,
e devolve um polígono. Cada canto é um quarto de elipse com os raios horizontal e vertical
próprios, e os raios são reduzidos proporcionalmente quando somam mais que o lado, como no CSS. O
desenho usa `fillPoints` + `strokePoints(…, true)` com `lineStyle(TRACO.ui, COR.traco)`, e a sombra
dura é o mesmo polígono em `COR.traco`, deslocado `(SOMBRA.x, SOMBRA.x)` e desenhado antes. Os
raios (`raio-bolha-a/b`, `raio-bolha-pressionada(-b)`, `raio-cartao`, `raio-painel`) entram como
constantes em `theme.ts`, copiadas de `tokens.css`. A pílula é o caso de raio 50% da altura, e o
círculo é `fillCircle`.

**Rationale**: `fillRoundedRect` do Phaser só aceita cantos circulares, e a bolha do design system
depende dos cantos elípticos diferentes. Como função pura (sem `import phaser`), ela é testável com
`bun test` (limites dentro do retângulo, simetria da pílula, escala dos raios).

**Alternatives considered**: renderizar `grotesco.css` em textura via SVG `foreignObject`
(frágil e assíncrono); `fillRoundedRect` com cantos diferentes (fica circular e "carimbado").
Ambos rejeitados.

## §5. Título com contorno

**Decision**: `Phaser.GameObjects.Text` com `color: branco`, `stroke: traco`, `strokeThickness: 8`
(contorno de 4px para fora), `shadow: { offsetX: 7, offsetY: 7, color: traco, blur: 0, stroke:
true, fill: true }` e `setAngle(-4 | -3)`. A variante pequena (para PontuacaoFlutuante no futuro)
usa 6/5, mas não é implementada agora (Princípio IV).

**Rationale**: é a forma nativa de fazer contorno em 8 direções com sombra dura, sem assets.

## §6. Ícones

**Decision**: carregar no `BootScene` com `this.load.svg(key, path, { width, height })`, rasterizados
em 2x (52px para ícones de 26px, 44px para o coração de 22px) e exibidos em escala 0.5, como já
é feito com os sprites. Usados agora: `pausar`, `som`, `tempo`, `coracao-cheio`. O estado "sem som"
tem dois sinais além da cor (FR-016): o botão em estado *ativo* (fundo creme, sombra pressionada) e
uma barra diagonal de 3px em `COR.traco` sobre o ícone.

**Rationale**: o SVG vetorial rasterizado em 2x fica nítido no `Scale.FIT`. A pasta
`client/public/assets/ui/` segue a organização do design system (ver Complexity Tracking no
`plan.md`).

## §7. Estados de botão no canvas (hover, pressionado, foco, ativo)

**Decision**: cada botão é um `Container` com uma zona interativa retangular do tamanho do botão
(`setInteractive` com `Rectangle`, `useHandCursor: false`, já que o cursor nativo está escondido).
- `pointerover` / `pointerout`: hover. Tween de 90ms para `x/y −3`, `angle = giro` (primário −3°,
  secundário +3°, terciário −2°, ícone −8°), sombra de hover e cor de hover.
- `pointerdown`: pressionado. Deslocamento +3, `scaleY 0.92`, sombra pressionada e raio de bolha
  pressionada. A ação dispara no `pointerup` dentro do botão, como o `:active` + `click` do CSS. A
  exceção é Pausar, que dispara no `pointerdown` como hoje, porque o mesmo evento precisa chamar
  `stopPropagation` antes do `handlePointerDown` da partida.
- **Movimento reduzido** (FR-023): `matchMedia('(prefers-reduced-motion: reduce)')`, lido uma vez no
  kit. Com ele ativo, não há giro no hover e a duração dos tweens é 0.
- **Rótulo acessível e foco (FR-008, FR-022)**: um botão DOM *visualmente oculto* (classe `sr-only`,
  1×1px fora da tela, nunca por cima do canvas) espelha cada botão do canvas com `aria-label`. O
  foco por teclado (Tab) nele desenha no canvas o anel de foco (3px `COR.traco`, afastado 4px), e
  Enter/Espaço dispara a mesma ação. Os proxies vivem num `<div id="ui-a11y">` em `index.html` e são
  criados e destruídos junto com a cena.

**Rationale**: reproduz o comportamento de `grotesco.css` sem DOM visível. Os proxies dão rótulo e
teclado sem cobrir o canvas, então não afetam a pata nem o clique.

**Alternatives considered**: sem proxy (o canvas não tem semântica, e FR-022 não seria atendido);
`aria-label` só no canvas (um nome único para a tela inteira). Rejeitados.

## §8. Composição do HUD nas duas bases

**Decision** (detalhes em `contracts/screens.md`):
- **Paisagem 960×600**: uma linha em `y = 16` (altura da linha 52 = botão de ícone). Pontos à
  esquerda (x = 20); tempo centrado em x = 480; à direita, a partir da borda (x = 940): Pausar,
  12px, barra de risco (160×28), 12px, pílula de comidas.
- **Retrato 480×960**: não cabe numa linha só, então vira duas. Linha 1: pontos, tempo (centro) e
  Pausar. Linha 2 (y = 16 + 52 + 12): pílula de comidas + barra de risco alinhadas à direita.
- **Folga das prateleiras**: a faixa de clique da prateleira superior começa em
  `SHELF_Y_POSITIONS[0] − ROACH_VISUAL_RADIUS − HITBOX_PADDING_PX`, ou seja, 134px (paisagem) e
  230px (retrato). O HUD termina em 68px (paisagem) e cerca de 124px (retrato). Só Pausar (canto
  superior direito) e Som (canto inferior direito) são interativos, e ficam fora da faixa das
  prateleiras. As regiões de nascimento ficam fora da tela (±40px), então nenhum controle as cobre.
- **Escala de texto no retrato**: os tamanhos do design system são mantidos (o `Scale.FIT` já
  reduz a tela inteira). Os painéis usam `min(larguraDoDesign, GAME_WIDTH − 2·hudLateral)`.

**Rationale**: atende a ordem decidida no clarify (pontos | tempo | comidas/risco + Pausar), com
Pausar sempre no canto, e cumpre FR-017/FR-025.

## §9. Formatação de números e tempo

**Decision**: `client/src/ui/format.ts` (puro) com `formatThousands(n)` (separador `.`, sem depender
do locale do navegador) e `formatClock(ms)` no formato `m:ss` (ex.: `0:45`, `12:03`). A função de
domínio `formatElapsedTime` (`mm:ss`) **não** muda, porque é coberta por `match.timer.test.ts`
(FR-026). O HUD passa a usar `formatClock`.

**Rationale**: a formatação é regra de apresentação e fica fora do domínio. Um separador fixo evita
variar com o `Intl` do navegador.

## §10. `MOVIMENTO` como fonte única

**Decision**: substituir por referências a `theme.ts` as constantes soltas com valor igual:
- `GameScene`: `SQUASH_STRETCH_*` e `TREMOR_*` viram `MOVIMENTO.agitacao`;
  `*_LOCOMOTION_*` viram `MOVIMENTO.barataAndando` / `MOVIMENTO.barataVoando`; a queda da barata
  eliminada (`y + 40`, `200ms`) vira `MOVIMENTO.barataEliminada`.
- `BootScene`: `frameRate` 15/20 vira `MOVIMENTO.barataAndando.fps` / `barataVoando.fps`.
- `CursorScene`: `LEAN_*`, ângulo −25 e escala 1.25 do golpe viram `MOVIMENTO.pata`.
- `gameConfig.ts`: `CURSOR_STRIKE_DURATION_MS = MOVIMENTO.pata.golpeMs` e `CURSOR_PAW_HEIGHT_PX =
  round(MOVIMENTO.pata.alturaPx · UI_SCALE)`.

Valores específicos do projeto que não existem no design system (`MOVEMENT_DEADZONE_PX`,
`NEUTRAL_FACING_DEG`, `ROACH_SPRITE_SCALE`, `ROACH_SPRITE_FORWARD_DEG`, o tween de "comida
roubada") continuam onde estão. `theme.ts` não importa `phaser`, então o domínio pode seguir
importando `gameConfig.ts` sem problema.

**Rationale**: FR-007 pede fonte única sem mudar comportamento. Os valores foram conferidos e são
idênticos.

## §11. Cenário da geladeira

**Decision**: as texturas geradas no `BootScene` mantêm as chaves e os tamanhos (`fridgeBg`
GAME_WIDTH×GAME_HEIGHT, `shelf` (GAME_WIDTH−120)×20, `food` 60×60):
- `fridgeBg`: `COR.ceu` chapado.
- `shelf`: `COR.branco` com contorno de 3px `COR.traco` e cantos levemente arredondados (raio 8).
  Para caber o traço, a textura cresce 4px em cada eixo e continua centrada no mesmo ponto.
- `food`: `COR.laranja`, bolha de raio 14 com contorno de `TRACO.arte` (3,5px), pontas em
  `COR.creme` (doce embrulhado) e dois traços curtos de brilho em `COR.branco`. O retângulo de 60×60
  é mantido.

**Rationale**: a geometria de clique não depende dessas texturas (hitbox fixa via
`ROACH_VISUAL_RADIUS`), mas mantê-las do mesmo tamanho preserva a leitura visual. A barata marrom
escura contrasta bem com o céu (`#9ed3e6`).

## §12. Cores da barra de risco

**Decision**: seguro = `COR.limao`, elevado = `COR.laranja`, crítico = `COR.vermelho`, com trilho
`COR.branco` e contorno `COR.traco`. A barra não tem texto, então laranja e limão são permitidos
(a restrição de contraste é só para texto). Segue o padrão do `gs-energia` (padding interno de 3px,
preenchimento em pílula). O nível continua legível pela proporção preenchida.
