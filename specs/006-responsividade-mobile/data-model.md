# Data Model: Responsividade mobile e compatibilidade de tela

Esta feature não introduz nem altera nenhuma entidade de domínio, nenhum campo do `Match`/
`MatchSnapshot`, nenhuma função pura de `entities/` ou `systems/`, nem nenhum dado de partida — é
uma mudança de configuração de apresentação (`data-model.md` da spec, seção Assumptions:
"não introduz nenhum novo dado de domínio nem novo estado de partida").

**Revisão (2026-09-15, `research.md` Decisão 1b)**: `gameConfig.ts` deixou de expor uma única
resolução lógica fixa (960×600) e passou a expor uma de duas **proporções-base**, escolhida uma
única vez no carregamento do módulo a partir de `window.innerWidth`/`innerHeight` — landscape
(960×600, valor original) ou portrait (480×960). `GAME_WIDTH`/`GAME_HEIGHT` continuam sendo
constantes simples (números), lidas em runtime por domínio e Scenes exatamente como antes; o que
mudou é que seu *valor* deixou de ser sempre o mesmo. `SHELF_Y_POSITIONS`/`FOOD_SLOT_X_POSITIONS`
também deixaram de ser arrays de pixels fixos e passaram a ser calculados a partir de frações da
proporção landscape original aplicadas ao `GAME_WIDTH`/`GAME_HEIGHT` ativo — nenhuma unidade nem
significado muda, e nenhum campo de domínio (`Match`, `Shelf`, `FoodItem`, `Roach`) passa a
depender de orientação: eles continuam recebendo posições em pixels lógicos, como sempre.

## Proporções-base (`gameConfig.ts`)

| Constante | Landscape (padrão / `bun test`) | Portrait (`window.innerHeight > innerWidth`) |
|---|---|---|
| `GAME_WIDTH` | `960` | `480` |
| `GAME_HEIGHT` | `600` | `960` |
| `UI_SCALE` (`GAME_WIDTH / 960`) | `1` | `0.5` |
| `SHELF_Y_POSITIONS` | `[160, 320, 480]` (inalterado) | `[256, 512, 768]` (mesma fração de `GAME_HEIGHT`) |
| `FOOD_SLOT_X_POSITIONS` | `[280, 480, 680]` (inalterado) | `[140, 240, 340]` (mesma fração de `GAME_WIDTH`) |

A escolha é feita uma única vez, na avaliação inicial do módulo — nunca recomputada durante uma
partida em andamento (`research.md`, Decisão 1b).

## Configuração de escala (`index.ts`)

Nova configuração, puramente de apresentação, adicionada ao `Phaser.Game` já existente — não é uma
entidade de domínio, é uma superfície de configuração desta feature (`research.md`, Decisões
1, 1b e 5):

| Campo (`Phaser.Types.Core.ScaleConfig`) | Valor | Papel |
|---|---|---|
| `mode` | `Phaser.Scale.FIT` | Escala o canvas renderizado para caber no elemento pai preservando a proporção-base ativa (FR-001/FR-002). |
| `autoCenter` | `Phaser.Scale.CENTER_BOTH` | Centraliza o canvas escalado dentro do pai nos dois eixos. |
| `min.width` | `320` | Piso do tamanho exibido do canvas (FR-006). |
| `min.height` | `Math.round((320 * GAME_HEIGHT) / GAME_WIDTH)` | Deriva do piso de largura preservando a proporção-base **ativa** (landscape → `200`; portrait → `640`) — revisado em 2026-09-15; antes era o literal `200` fixo. |
| `max` | *(omitido)* | Sem teto de ampliação — decisão explícita da clarificação de 2026-09-14 para viewports muito grandes. |

## Relação com o layout DOM (`index.html`)

```
html, body               → 100% do viewport, overflow-x: auto (permite rolagem abaixo de 320px)
  └── #game (parent)     → 100% de html/body, fundo #0d0d0d (cor de letterbox)
        └── <canvas>     → dimensionado pelo Scale Manager (Decisão 1/5), sempre na proporção-base ativa internamente
```

## Escala de fonte fixa (`UI_SCALE`)

`StartScene.ts`/`GameOverScene.ts` usam `fontSize`/`padding` em pixels literais (não relativos ao
canvas) — o `Scale Manager` escala o canvas inteiro na tela, mas não recalcula quantos pixels
*lógicos* uma string ocupa. Textos calibrados contra 960px de largura lógica ficavam cortados na
base portrait (480px). `UI_SCALE = GAME_WIDTH / 960` (`1` em landscape, `0.5` em portrait) é
multiplicado por cada valor fixo (`Math.round(valor * UI_SCALE)`), mantendo a mesma proporção
texto/canvas em qualquer base (`research.md`, Decisão 4 revisada).

Nenhuma alteração é feita em `Match`, `MatchSnapshot`, `FoodItem`, `Shelf`, `Roach`,
`MatchStateManager`, `CollisionSystem` ou em qualquer função pura de `entities/`/`systems/` — esta
feature é estritamente configuração de escala do `Phaser.Game`, escolha de proporção-base/frações de
layout em `gameConfig.ts`, e escala de fonte fixa em duas Scenes de apresentação (não-gameplay).
