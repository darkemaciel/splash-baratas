# Research: Reposicionamento e Restilização do HUD

Resolve as decisões técnicas necessárias para implementar o reposicionamento/restilização do HUD
descrito em `spec.md`. O escopo é puramente de apresentação — nenhuma pergunta de domínio ficou em
aberto após a sessão de `/speckit-clarify` (fonte "Fredoka", barra em preenchimento contínuo,
pontuação em 28px), então não há `NEEDS CLARIFICATION` remanescente.

## 1. Como desenhar a barra vertical

**Decision**: reaproveitar a mesma técnica de `redrawHudBar()` (`GameScene.ts`, specs/002) —
`Phaser.GameObjects.Graphics` com dois `fillRect`: um "trilho" (`HUD_BAR_TRACK_COLOR`) do tamanho
total e um preenchimento colorido por `riskLevel` por cima — só que trocando qual dimensão é fixa
e qual é proporcional. Hoje a largura é proporcional (`HUD_BAR_WIDTH * ratio`) com altura fixa; na
vertical, a **altura** passa a ser proporcional (`HUD_BAR_LENGTH * ratio`) com largura fixa, e o
preenchimento colorido é desenhado a partir da base do trilho para cima (`y = trilhoBottom -
alturaPreenchida`), não do topo para baixo — assim o "fôlego" restante fica sempre ancorado na
base, esvaziando pelo topo conforme o risco aumenta, replicando a leitura da barra de vida do Mega
Man X sem introduzir segmentação em blocos (decisão já tomada na clarificação).

**Rationale**: `redrawHudBar()` já é redesenhada por evento (não por frame, Princípio V) e já
centraliza a lógica de proporção/cor por `riskLevel` — inverter os eixos e a âncora de
preenchimento é uma mudança geométrica local, sem introduzir nenhuma abstração nova nem nenhuma
dependência de física/segmentação.

**Alternatives considered**: desenhar a barra com sprites pré-renderizados em blocos (estilo MMX
literal) — rejeitado na sessão de clarificação (Princípio IV, simplicidade deliberada) em favor do
preenchimento contínuo já existente, só reorientado.

## 2. Onde posicionar o agrupamento canto superior direito

**Decision**: ancorar o agrupamento (contador + barra vertical) a uma margem fixa da borda direita
e do topo: `HUD_MARGIN_RIGHT = 36`, barra com `HUD_BAR_THICKNESS = 16` (largura) ×
`HUD_BAR_LENGTH = 160` (altura), topo da barra em `y = 56`. O centro horizontal do agrupamento fica
em `x = GAME_WIDTH - HUD_MARGIN_RIGHT - HUD_BAR_THICKNESS / 2 = 916`; o contador numérico fica
centralizado nesse mesmo `x`, em `y = 32` (acima do topo da barra).

**Rationale**: a prateleira mais próxima do canto superior direito é a primeira
(`SHELF_Y_POSITIONS[0] = 160`), desenhada como sprite de `GAME_WIDTH - 120 = 840` de largura
centralizado em `GAME_WIDTH / 2`, ou seja, com borda direita em `x = 900`
(`GameScene.create()`: `this.add.image(GAME_WIDTH / 2, shelfY + 40, "shelf")`). Com
`HUD_BAR_THICKNESS = 16` e `HUD_MARGIN_RIGHT = 36`, a borda esquerda do agrupamento fica em
`x = 908` — 8px à direita da borda da prateleira, sem sobreposição (FR-009). A comida mais à
direita (`FOOD_SLOT_X_POSITIONS` máximo `680`, sprite de 60px) termina em `x = 710`, com folga
ainda maior. Uma barata que nasce no ponto de spawn direito (`SPAWN_POINTS`: `x = GAME_WIDTH + 40,
y = GAME_HEIGHT / 2 = 300`) pode cruzar visualmente a faixa `x ∈ [908, 924]` logo no início do seu
trajeto, mas nesse ponto `y` ainda está próximo de `300` — fora da faixa vertical do agrupamento
(`y ∈ [32, 216]`) — e, como já estabelecido em `specs/002-hud-progresso-risco/research.md §4`, o
HUD não é uma hitbox: mesmo que uma barata cruzasse visualmente essa área, o clique continuaria
funcionando normalmente sobre a barata (Princípio V preservado).

**Alternatives considered**: manter o HUD centralizado horizontalmente e só reorientar a barra —
rejeitado porque contradiz diretamente o pedido explícito da spec (canto superior direito).

## 3. Fonte cartunesca — hospedagem e carregamento

**Decision**: hospedar a fonte **Fredoka** (Google Fonts, licença OFL) como asset estático
versionado em `client/public/assets/fonts/Fredoka-Bold.woff2` (Princípio VI), declarada via
`@font-face` no `<style>` já existente em `client/index.html`, com pilha de fallback
`"Fredoka", "Comic Sans MS", cursive, sans-serif` (satisfaz o edge case de fallback do spec.md sem
nenhuma lógica de detecção de erro em código — é comportamento nativo do CSS). Em
`BootScene.preload()`/`create()`, chamar `document.fonts.load('bold 28px "Fredoka"')` e aguardar a
Promise (com um teto curto, ex. `Promise.race` com timeout de 1s) antes de `this.scene.start
("StartScene")`, para que o texto já nasça com a fonte final aplicada em vez de trocar de fonte
após o primeiro layout (evita "FOUT" perceptível, já que texto do Phaser é desenhado em canvas e
não reflui sozinho quando uma fonte troca depois de renderizado).

**Rationale**: o projeto já reserva `client/public/assets/fonts/` (hoje só com `.gitkeep`) —
seguir essa convenção evita introduzir uma nova pasta. Carregar a fonte uma única vez em
`BootScene`, antes de qualquer `Scene` de gameplay existir, é consistente com o padrão já usado
para áudio (specs/003: todo carregamento de asset acontece em `BootScene.preload()`) e não introduz
custo por frame — é um gate assíncrono único na inicialização, sem impacto em FPS/responsividade de
clique durante a partida (Princípio V). O fallback via pilha CSS cobre o edge case "fonte não
carrega a tempo" sem exigir tratamento de erro explícito no código: o texto some renderizado com
`Comic Sans MS` (outra fonte cartunesca já presente na maioria dos sistemas), preservando o layout.

**Alternatives considered**: carregar via Google Fonts CDN (`<link href="fonts.googleapis.com/...">`)
— rejeitado por adicionar uma dependência de rede externa em tempo de execução para um requisito
puramente visual, contrariando a natureza "asset estático versionado" do Princípio VI e arriscando
atraso de carregamento fora do controle do projeto. Usar uma `WebFontLoader` de terceiros — rejeitado
por adicionar uma dependência nova ao projeto (Princípio VII, stack fixa) quando a Font Loading API
nativa do navegador (`document.fonts.load`) já resolve o problema sem biblioteca extra.

## 4. Tamanho e família de fonte do contador de comidas restantes

**Decision**: o contador de comidas restantes (canto superior direito) passa a usar a família
"Fredoka" (FR-008), mantendo o tamanho atual de 18px (`hudText`) — a clarificação definiu apenas o
tamanho-alvo da **pontuação** (28px); não há pedido de aumentar o contador de vida, só de trocar a
fonte para consistência visual.

**Rationale**: a spec (FR-008 e User Story 3) pede consistência de *família* tipográfica entre os
dois textos do HUD, não necessariamente o mesmo tamanho — a pontuação é o elemento que precisa se
destacar mais (FR-006); o contador de vida já está posicionado num canto compacto junto à barra
vertical, onde um tamanho maior competiria por espaço.

**Alternatives considered**: igualar também o tamanho (28px) do contador de vida ao da pontuação —
rejeitado por não ter sido pedido na spec nem na clarificação, e por potencialmente não caber no
agrupamento compacto do canto superior direito (§2).

## 5. Testes

**Decision**: nenhuma nova função pura de domínio é criada (a mudança é 100% de apresentação em
`GameScene`), então não há novo teste `bun test` a escrever para esta feature — o suite existente
(`match.hud.test.ts`, `matchStateManager.score.test.ts`, etc.) já cobre os valores derivados que o
HUD lê (`foodRemainingCount`, `foodTotalCount`, `riskLevel`, `score`) e continua passando sem
alteração, porque nenhum desses cálculos muda. A validação desta feature é inteiramente manual via
`bun run dev`: reposicionamento, orientação da barra, fonte e tamanho de texto — mesmo padrão já
usado nas partes visuais de specs 002/003/004 (sem suíte de teste de renderização Phaser no
projeto).

**Rationale**: consistente com o Princípio I — como nenhuma regra de jogo muda, não há nova
superfície de domínio a testar; consistente com specs anteriores, que também trataram validação
puramente visual como manual.

**Alternatives considered**: escrever um teste automatizado para as novas constantes de
posicionamento em `GameScene.ts` (ex.: "a barra não deve sobrepor a prateleira") — rejeitado por
testar valores geométricos fixos que não mudam em runtime (não há lógica condicional a cobrir);
seria testar constantes contra si mesmas, sem valor de regressão real.
