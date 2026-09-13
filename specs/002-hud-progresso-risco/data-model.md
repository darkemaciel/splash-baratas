# Data Model: HUD de Progresso/Risco

Esta feature não introduz nenhuma entidade nova de domínio — apenas leituras derivadas do `Match`
já modelado em `specs/001-roach-fridge-clicker/data-model.md`. Os "campos" abaixo são valores
calculados (funções puras), nunca estado mutável persistido no `Match`.

## RiskLevel (tipo derivado)

Nível de risco visual exibido pelo HUD, derivado da proporção de comidas restantes.

| Valor | Condição (sobre o `Match` corrente) | Correspondência na spec |
|---|---|---|
| `'safe'` | `foodRemainingCount(match) / foodTotalCount(match) > 0.5` | "seguro" (FR-005) |
| `'elevated'` | `foodRemainingCount(match) / foodTotalCount(match) <= 0.5` **e** `foodRemainingCount(match) > 1` | "risco elevado" (FR-005) |
| `'critical'` | `foodRemainingCount(match) === 1` | "crítico" (FR-005) |

**Regras de validação**:
- Os três valores são mutuamente exclusivos e exaustivos para `foodRemainingCount(match) >= 1`
  (não há nível definido para `0`, pois `status` já é `'lost'` e o HUD não é exibido — FR-008).
- `riskLevel` é puramente derivado — nunca é escrito diretamente; recalculado a cada leitura via
  `getSnapshot()`.

## Valores derivados expostos via `MatchSnapshot`

Adições à interface `MatchSnapshot` (`systems/MatchStateManager.ts`), calculadas dentro de
`getSnapshot()` a partir do `Match` interno:

| Campo | Tipo | Cálculo | Notas |
|---|---|---|---|
| `foodRemainingCount` | `number` | `match.foodItems.filter(i => i.state === 'present').length` | Nunca lido diretamente de um contador separado — sempre recontado a partir de `foodItems` para nunca divergir do estado real (FR-002). |
| `foodTotalCount` | `number` | `match.foodItems.length` | Reflete o total real da partida corrente, não uma constante hardcoded, mesmo que hoje coincida com `TOTAL_FOOD_ITEMS` (`gameConfig.ts`). |
| `riskLevel` | `RiskLevel` | ver tabela acima | Calculado a partir de `foodRemainingCount`/`foodTotalCount`, nunca armazenado separadamente no `Match`. |

**Regras de validação**:
- `0 <= foodRemainingCount <= foodTotalCount` sempre.
- `foodRemainingCount === foodTotalCount` imediatamente após `match:started` (FR-006 do HUD /
  FR-013 do MVP).
- `foodRemainingCount` decresce em exatamente 1 a cada evento `food:stolen`; nunca é afetado por
  `roach:eliminated` (FR-003, FR-004 do HUD).

## Relações

```
Match 1───1 (foodRemainingCount, foodTotalCount, riskLevel)   [derivados, não persistidos]
```

Nenhuma alteração é feita em `FoodItem`, `Shelf`, `Roach` ou nas transições de `Match.status`
documentadas em `specs/001-roach-fridge-clicker/data-model.md` — esta feature é estritamente
aditiva sobre leituras.
