# Research: Responsividade mobile e compatibilidade de tela

**Feature**: `006-responsividade-mobile` | **Date**: 2026-09-15

## Contexto investigado

Código atual (`client/index.ts`, `client/index.html`) instancia `Phaser.Game` com `width: 960,
height: 600` e nenhuma configuração `scale` — modo padrão do Phaser (`ScaleModes.NONE`), canvas de
tamanho fixo em pixels CSS, centralizado só via flexbox em `html, body`. Todas as posições de
domínio (`gameConfig.ts`: `SHELF_Y_POSITIONS`, `FOOD_SLOT_X_POSITIONS`, `SPAWN_POINTS`) e todo o
desenho em `GameScene`/`StartScene`/`GameOverScene`/HUD são expressos nesse mesmo espaço lógico
960×600 fixo — nenhuma Scene usa `window.innerWidth`/`innerHeight` ou qualquer unidade de viewport
diretamente.

**Atualização pós-teste manual (2026-09-15)**: a investigação original concluía que a solução
inteira poderia viver só na configuração do `Phaser.Game`/`Scale Manager`, sem tocar em
`gameConfig.ts`. Testar essa versão em emulação de celular (390×844, retrato) mostrou o problema
descrito em `plan.md` (Revisão) — a proporção fixa 960:600 desperdiçava ~72% da altura da tela em
retrato. Isso adiciona a Decisão 1b abaixo; as Decisões 2–6 originais (mecanismo `FIT`, sincronia de
clique, limite mínimo, ausência de testes automatizados) continuam válidas e não mudam de
fundamento, só de detalhe onde anotado.

## Decisão 1 — Mecanismo de escala

**Decision**: usar o `Scale Manager` nativo do Phaser (`Phaser.Scale.FIT` + `autoCenter:
Phaser.Scale.CENTER_BOTH`), configurado uma única vez em `index.ts`, mantendo `width: GAME_WIDTH,
height: GAME_HEIGHT` (960×600) como a resolução lógica fixa do jogo.

**Rationale**:
- `FIT` escala o canvas renderizado para caber inteiramente dentro do elemento pai, preservando a
  proporção original (`960:600`) — nunca estica nem corta, satisfazendo FR-001/FR-002/SC-001/SC-002
  diretamente, sem nenhum código de layout customizado (Princípio IV — simplicidade deliberada).
- Como o pai (`div#game`) não terá necessariamente a mesma proporção do jogo, o espaço sobrando
  dentro do pai fica vazio — mostrando o fundo `#0d0d0d` já definido em `html, body`/`#game`, que é
  exatamente o letterbox/pillarbox neutro pedido em FR-002 e já assumido em `spec.md` (Assumptions).
  Não é necessário desenhar nenhuma borda: é ausência de conteúdo do canvas sobre um fundo escuro
  consistente.
- Confirmado lendo `node_modules/phaser/src/scale/ScaleManager.js`: o Scale Manager registra
  `window.addEventListener('resize', ...)` e `window.addEventListener('orientationchange', ...)`
  internamente (linhas ~1562/1565) — redimensionar a janela, girar o dispositivo ou mudar o zoom do
  navegador (que dispara `resize`) já recalcula e reaplica o layout automaticamente, sem precisar de
  nenhum listener escrito à mão em `GameScene`/`index.ts`. Isso cobre FR-004/SC-004 de graça.
- `RESIZE` (outro modo do Scale Manager) foi descartado: ele muda a *resolução lógica* do jogo para
  bater com o viewport, o que obrigaria a recalcular todas as posições fixas em `gameConfig.ts`
  (prateleiras, comidas, HUD) por viewport — o oposto da simplicidade que `FIT` oferece e uma
  violação clara do Princípio IV.
- `ENVELOP` foi descartado por poder cortar conteúdo nas bordas (ele preenche o pai inteiro
  recortando o excesso) — contradiz FR-002 (não pode cortar prateleiras/comidas/HUD).

**Alternatives considered**:
- CSS puro (`transform: scale()` calculado manualmente via JS em `resize`) — reimplementaria o que
  o Scale Manager já faz nativamente, com mais código e mais superfície de bug.
- Redesenhar `gameConfig.ts` para posições relativas (%) — mudaria a fundação de todo o domínio já
  testado (`bun test`) e violaria a separação lógica/renderização (Princípio I) sem necessidade,
  já que o problema é 100% de apresentação.

## Decisão 1b — Proporção-base por orientação (revisão pós-teste manual, 2026-09-15)

**Decision**: em vez de uma única proporção lógica fixa (960:600) sempre, `gameConfig.ts` escolhe
entre duas proporções-base, uma única vez no carregamento do módulo: landscape (960×600, valor
original, usado quando `window.innerWidth >= window.innerHeight` ou quando `window` não existe —
`bun test`) ou portrait (480×960, quando `window.innerHeight > window.innerWidth`). `SHELF_Y_POSITIONS`
e `FOOD_SLOT_X_POSITIONS` deixam de ser arrays de pixels fixos e passam a ser calculados a partir de
frações da proporção landscape original (`160/600`, `320/600`, `480/600` para Y; `280/960`, `480/960`,
`680/960` para X) aplicadas a `GAME_HEIGHT`/`GAME_WIDTH` ativos — a grade lógica 3×3 de
prateleiras/comidas continua idêntica em proporção, só o "mundo" ao redor dela muda de forma.
`index.ts` deixa de usar `min: { width: 320, height: 200 }` fixo e passa a derivar `min.height` de
`Math.round((320 * GAME_HEIGHT) / GAME_WIDTH)`, para que o piso de 320px continue preservando a
proporção-base ativa (landscape ou portrait) em vez de assumir sempre 960:600.

**Rationale**:
- FR-001/FR-002 continuavam satisfeitos pela Decisão 1 (nunca distorce/corta), mas o resultado
  visual em retrato contrariava o objetivo real do pedido do usuário ("aproveitar a tela alongada
  do celular sem precisar girar") — confirmado com uma captura de tela em emulação de 390×844: o
  campo de jogo ocupava só ~234px de altura de 844px disponíveis.
- 480×960 foi escolhido por ser: (a) múltiplo redondo de 480/960, mesma ordem de grandeza da base
  original (não introduz uma unidade nova); (b) próximo o bastante da proporção física comum de
  celulares atuais (~9:18–9:19.5) para que o `Scale Manager` (`mode: FIT`) preencha a maior parte
  da altura real do dispositivo, sem precisar de um valor por-dispositivo.
- A escolha acontece **uma única vez no carregamento**, nunca recomputada durante uma partida em
  andamento — girar o dispositivo fisicamente no meio do jogo continua coberto por FR-004 apenas
  como reescala/letterbox da base já escolhida (comportamento da Decisão 1), nunca como troca de
  layout; isso evita qualquer necessidade de re-layout dinâmico de `Match`/Scenes em runtime, a
  favor da Simplicidade Deliberada (Princípio IV).
- Como `SHELF_Y_POSITIONS`/`FOOD_SLOT_X_POSITIONS` continuam sendo lidos em runtime (nunca
  inlined/cacheados em outro módulo antes do primeiro uso), `GameScene.ts`, `BootScene.ts`,
  `MatchStateManager` e `CollisionSystem` não precisaram de nenhuma mudança de código — eles só
  passaram a receber valores diferentes das mesmas constantes exportadas (confirmado por
  `bun test`, 44/44 passando sem alteração de nenhum teste, e por teste manual no navegador).

**Alternatives considered**:
- Manter uma única proporção-base e só reduzir o quanto o letterbox "incomoda" (ex. proporção mais
  próxima de quadrada, tipo 4:5, aplicada sempre) — rejeitado por ainda deixar uma faixa preta
  perceptível em retrato extremo, e por mudar a proporção também em desktop/landscape sem
  necessidade (regressão visual do layout já validado).
- Recalcular a proporção-base a cada `resize`/rotação em runtime (não só no carregamento) —
  rejeitado por exigir destruir/recriar o `Phaser.Game` ou reimplementar posicionamento dinâmico de
  `Match` a meio da partida; nenhuma acceptance scenario da spec pede reflow ao vivo, só "não exigir
  rotação manual para começar a jogar" (spec.md, Clarifications).

## Decisão 2 — Sincronia de clique (Princípio V / FR-005)

**Decision**: nenhuma mudança em `CollisionSystem.ts` nem em `GameScene.handlePointerDown`
(`pointer.x`/`pointer.y`).

**Rationale**: o `Phaser.Input.Pointer` sempre expõe coordenadas já convertidas para o espaço
lógico do jogo (0–960, 0–600) — a conversão do evento DOM (posição real na tela) para coordenada de
jogo é feita internamente pelo próprio `InputManager`/`ScaleManager` a cada evento, usando o fator
de escala atual. Como `handlePointerDown` já usa `pointer.x`/`pointer.y` diretamente (nunca
`event.clientX`/`clientY`), o hit-test em `pickTopmostHit` continua recebendo coordenadas no mesmo
espaço lógico em que `positionAt(roach, ...)` e `foodItemPosition(...)` já operam — a sincronia
exigida pelo Princípio V é uma propriedade do Scale Manager, não algo a implementar. O caso de borda
"resize no meio da animação de uma barata" (spec.md, Edge Cases) também é coberto: a posição da
barata é recalculada a cada `update()` a partir de `Match`/tempo de domínio (nunca cacheada em
pixels de tela), e o pointer sempre resolve contra a escala vigente no momento do clique — não há
janela onde as duas fiquem dessincronizadas.

**Alternatives considered**: nenhuma — esta não é uma decisão de design, é uma verificação de que a
convenção já usada no código (ler sempre `pointer.x/y`, nunca coordenadas DOM cruas) já é
compatível com escala dinâmica.

## Decisão 3 — Escala da HUD (Clarifications, sessão 2026-09-14)

**Decision**: nenhuma mudança em `updateHud`/`redrawHudBar`/`updateScore`/constantes de HUD em
`GameScene.ts`.

**Rationale**: a clarificação decidiu explicitamente que a HUD escala na mesma proporção do resto
do campo de jogo. Como todo o HUD (`hudText`, `hudBar`, `scoreText`) já é desenhado com
`Phaser.GameObjects` posicionados no mesmo espaço lógico 960×600 (constantes `HUD_MARGIN_RIGHT`,
`HUD_BAR_TOP_Y` etc. em `GameScene.ts`), o Scale Manager escala esses objetos junto com
prateleiras/comidas/baratas automaticamente — exatamente o comportamento pedido, sem nenhuma
lógica de layout responsivo separada para a HUD (FR-003).

## Decisão 4 — Telas de início/fim de jogo (FR-007)

**Decision (revisada em 2026-09-15)**: `StartScene.ts`/`GameOverScene.ts` passam a escalar seus
tamanhos de fonte/padding fixos em px por `UI_SCALE = GAME_WIDTH / 960` (novo export de
`gameConfig.ts`). Em landscape `UI_SCALE` é sempre `1` (nenhuma mudança visual em desktop).

**Rationale**: a decisão original assumia que "desenhar em coordenadas `GAME_WIDTH`/`GAME_HEIGHT`"
bastava para textos também não cortarem — verdade para posição (`GAME_WIDTH/2`, centralizado), mas
falsa para **tamanho de fonte fixo em px**: o Scale Manager (Decisão 1) escala o canvas inteiro na
tela, mas não recalcula o quão larga uma string de texto fica dentro do espaço lógico. O título
"Baratas na Geladeira" a 40px e a mensagem "Todas as comidas foram roubadas! Você perdeu." a 32px
foram calibrados visualmente contra 960px de largura lógica; testado manualmente na base portrait
(480px de largura lógica, Decisão 1b), ambos ultrapassavam a largura do canvas e ficavam
literalmente cortados nas bordas — violação direta de FR-007/FR-003 ("sem texto cortado"),
confirmada com captura de tela antes e depois da correção. `UI_SCALE` resolve isso com uma única
constante multiplicando todo tamanho fixo em px dessas duas Scenes, sem introduzir lógica de
quebra de linha/medição de texto customizada (Princípio IV).

**Alternatives considered**:
- Medir a largura real do texto renderizado (`Text.width` do Phaser) e reduzir a fonte
  dinamicamente até caber — mais preciso, mas adiciona lógica de ajuste iterativo por texto onde uma
  única constante de escala já resolve os casos reais (títulos/mensagens curtas e fixas, não
  conteúdo de usuário de tamanho arbitrário).
- Quebrar o título em duas linhas via `\n` fixo — não generaliza para outras strings desta tela
  (ex. mensagem de derrota) e ainda dependeria de acertar o tamanho por tentativa.

## Decisão 5 — Limite inferior (<320px) e degradação (FR-006, Clarifications)

**Decision (revisada em 2026-09-15)**: configurar `scale.min = { width: 320, height:
Math.round((320 * GAME_HEIGHT) / GAME_WIDTH) }` no `Phaser.Game` — `height` deixou de ser o literal
`200` fixo (que só preserva 960:600) e passou a ser derivado da proporção-base **ativa** (Decisão
1b: landscape 960:600 → 200, portrait 480:960 → 640), para que o piso de 320px de largura continue
proporcional em qualquer orientação. Em `index.html`, trocar o `body` de centralização via flexbox
(`display: flex; justify-content: center; align-items: center`) para um contêiner que permita
`overflow-x: auto` quando o conteúdo (canvas travado em 320px de largura exibida) ultrapassar a
largura do viewport.

**Rationale**: confirmado em `node_modules/phaser/types/phaser.d.ts` (`ScaleConfig.min`/`.max` —
"The minimum/maximum width and height the canvas can be scaled down/up to") que `min` restringe o
*tamanho exibido* do canvas, não a resolução lógica — abaixo de 320px de viewport, o Scale Manager
para de encolher o canvas em 320×200 (equivalente à Decisão de Clarificação: "trava na escala
mínima"), e o excesso passa a ultrapassar os limites do `body`. Sem `overflow-x`, esse excesso
seria invisível/cortado pelo navegador; com `overflow-x: auto`, o próprio navegador oferece rolagem
horizontal — exatamente o comportamento decidido na clarificação, sem nenhum código JS de scroll
customizado. `scale.max` é deliberadamente **omitido** (não definido) — a clarificação decidiu que
não há teto de ampliação para viewports muito grandes (FR-006).

**Alternatives considered**: aplicar um `min-width: 320px` via CSS no `#game` e deixar o Phaser
encolher normalmente até lá — rejeitado porque o Scale Manager já resolve isso nativamente via
`scale.min`, e duplicar a regra em dois lugares (JS e CSS) arrisca os dois valores divergirem no
futuro.

## Decisão 6 — Testes automatizados

**Decision**: nenhum teste `bun test` novo. A suíte existente em `client/tests/unit/` cobre apenas
o domínio (entidades/`MatchStateManager`), que não muda nesta feature (research.md acima). A
validação desta feature é 100% manual (redimensionar janela / emulação de dispositivo do DevTools /
três navegadores-alvo), documentada em `quickstart.md`, na mesma linha do que `specs/005` já fez
para uma mudança de apresentação.

**Nota de execução (2026-09-15)**: a validação manual planejada foi de fato executada nesta sessão
via extensão Claude in Chrome (Microsoft Edge) — landscape (desktop) e portrait (emulado, 390×844)
em `StartScene`, `GameScene` (prateleiras/HUD/pontuação) e `GameOverScene`, incluindo o cenário de
score com muitos dígitos que motivou os ajustes de HUD relacionados. Não foi possível validar Chrome
nem Firefox nesta sessão (só Edge estava disponível no ambiente) — ver `tasks.md` para o detalhamento
de quais tasks de validação ficaram efetivamente confirmadas.

**Rationale**: não há função de domínio pura nova para testar com `bun test` — o comportamento em
questão (layout do canvas, resposta a `resize`) só existe no runtime do navegador (`window`, CSS,
DOM), fora do escopo do que a suíte unitária atual (Bun, sem DOM) consegue exercitar de forma
significativa. Introduzir um ambiente de teste com DOM/browser só para esta feature seria uma nova
dependência de stack não justificada (Princípio VII — stack fixada) para um ganho de cobertura
marginal, já que os três navegadores-alvo serão validados manualmente de qualquer forma (US3/SC-006).

## Resumo de impacto

| Arquivo | Mudança |
|---|---|
| `client/index.ts` | + bloco `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, min: { width: 320, height: Math.round((320 * GAME_HEIGHT) / GAME_WIDTH) } }` no `Phaser.Game` |
| `client/index.html` | `#game`/`body` passam a ocupar 100% do viewport (em vez de centralizar via flexbox com tamanho intrínseco do canvas); `overflow-x: auto` para o caso <320px |
| `client/src/config/gameConfig.ts` | `GAME_WIDTH`/`GAME_HEIGHT` escolhidos uma vez por orientação (Decisão 1b); `SHELF_Y_POSITIONS`/`FOOD_SLOT_X_POSITIONS` derivados por fração em vez de array fixo; + `UI_SCALE` (Decisão 4 revisada) |
| `client/src/scenes/StartScene.ts`, `GameOverScene.ts` | tamanhos de fonte/padding fixos em px passam a ser `Math.round(valor * UI_SCALE)` (Decisão 4 revisada) |
| `GameScene.ts`, `BootScene.ts`, entidades, `MatchStateManager`, `CollisionSystem` | **nenhuma mudança** — já liam as constantes de `gameConfig.ts` em runtime |
| `client/tests/unit/` | **nenhuma mudança** |

Todos os `NEEDS CLARIFICATION` do Technical Context (ver `plan.md`) estão resolvidos pelas decisões
acima.
