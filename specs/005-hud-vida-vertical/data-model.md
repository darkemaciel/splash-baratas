# Data Model: Reposicionamento e Restilização do HUD

Esta feature não introduz nem altera nenhuma entidade de domínio, nenhum campo do `Match`/
`MatchSnapshot`, nem nenhuma regra derivada (`foodRemainingCount`, `foodTotalCount`, `riskLevel`,
`score` — todos já modelados em `specs/001-roach-fridge-clicker/data-model.md` e
`specs/002-hud-progresso-risco/data-model.md`, `specs/004-sistema-pontuacao/data-model.md`).
`GameScene` continua lendo esses valores exclusivamente via `MatchStateManager.getSnapshot()`
(Princípios I e II) — só a forma como são desenhados na tela muda.

## Constantes de apresentação (`scenes/GameScene.ts`)

Novas constantes puramente visuais, sem relação com regras de jogo — locais ao módulo
`GameScene.ts`, no mesmo lugar onde já vivem as constantes de HUD atuais (`HUD_BAR_WIDTH`,
`HUD_BAR_HEIGHT`, `HUD_BAR_Y`, `HUD_BAR_TRACK_COLOR`, `HUD_RISK_COLORS`, `SCORE_TEXT_Y` — todas
declaradas no topo de `GameScene.ts`, não em `gameConfig.ts`, por serem detalhes de renderização
sem significado de domínio). As constantes abaixo substituem `HUD_BAR_WIDTH`/`HUD_BAR_HEIGHT`/
`HUD_BAR_Y`/`SCORE_TEXT_Y` (que descreviam a barra horizontal centralizada) conforme
`research.md §1-§4`; `HUD_BAR_TRACK_COLOR` e `HUD_RISK_COLORS` são reaproveitados sem alteração:

| Constante | Valor | Uso |
|---|---|---|
| `HUD_MARGIN_RIGHT` | `36` | Distância da borda direita da tela até a borda direita do agrupamento vida/barra. |
| `HUD_BAR_THICKNESS` | `16` | Largura fixa da barra vertical (antes: altura fixa da barra horizontal). |
| `HUD_BAR_LENGTH` | `160` | Altura total da barra vertical (antes: largura total da barra horizontal, `HUD_BAR_WIDTH`). |
| `HUD_BAR_TOP_Y` | `56` | Coordenada Y do topo da barra vertical. |
| `HUD_LIFE_COUNTER_Y` | `32` | Coordenada Y do contador numérico de comidas restantes, acima da barra. |
| `SCORE_FONT_SIZE_PX` | `28` | Tamanho da fonte da pontuação (era `16`, FR-006 / SC-003). |
| `HUD_FONT_FAMILY` | `'"Fredoka", "Comic Sans MS", cursive, sans-serif'` | Família aplicada à pontuação (FR-007) e ao contador de vida (FR-008). |

## Relações

```
Match ──1:1── MatchSnapshot (já existente, inalterado)
                 │
                 ├── foodRemainingCount, foodTotalCount, riskLevel  → contador + barra vertical (canto superior direito)
                 └── score                                          → texto de pontuação (topo central, fonte Fredoka 28px)
```

Nenhuma alteração é feita em `Match`, `MatchSnapshot`, `FoodItem`, `Shelf`, `Roach` ou em qualquer
função pura de `entities/Match.ts` — esta feature é estritamente uma reorganização/restilização de
`GameScene` sobre dados já expostos.
