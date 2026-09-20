# Data Model: Teto de Baratas Simultâneas Progressivo

Esta feature não introduz nenhum campo novo em `Match`, `FoodItem`, `Shelf`, `Roach` ou
`MatchSnapshot` (documentados em `specs/001-roach-fridge-clicker/data-model.md` e estendidos pelas
features seguintes). O "Teto de baratas simultâneas" (Key Entities do `spec.md`) não é um campo de
`Match` — é um valor puramente derivado, recalculado a cada `tick()` a partir de `survivalMs`
(`elapsedMs(match, now)`, já existente desde `specs/007-tempo-de-sobrevivencia`), no mesmo espírito
de `currentSpawnIntervalMs`/`currentTravelDurationMs` (`specs/011-dificuldade-progressiva`).

## Constantes novas (`client/src/config/gameConfig.ts`)

**Revisão pós-verificação empírica** (`research.md` §3): a concorrência natural de baratas hoje
nunca passa de 2 simultâneas, em qualquer ponto da rampa de dificuldade — verificado rodando o
`MatchStateManager` real sem nenhuma eliminação. Os valores abaixo foram revisados de `3`/
`TOTAL_FOOD_ITEMS` (9) para `1`/`2`, os únicos capazes de ter algum efeito observável.

| Constante | Valor | Papel |
|---|---|---|
| `ROACH_CAP_BASE` | `1` | Teto de baratas simultâneas no início de toda partida (`survivalMs=0`) — FR-002; único valor abaixo do teto natural de concorrência de hoje (2) |
| `ROACH_CAP_MAX` | `2` | Teto no fim da rampa de dificuldade e além — FR-005; iguala o teto natural de concorrência de hoje, sem reduzi-lo nem ampliá-lo |

Nenhuma constante nova de duração de rampa — reaproveita `DIFFICULTY_RAMP_DURATION_MS`, já existente
(`specs/011-dificuldade-progressiva`), conforme `research.md` §3.

**Consequência aceita**: com só 2 valores inteiros possíveis, a "rampa" de `currentRoachCap` é uma
única transição discreta no meio de `DIFFICULTY_RAMP_DURATION_MS` (via `Math.round`), não vários
incrementos graduais como as demais curvas de `specs/011` — decisão explícita do dono do produto após
`research.md` §3, aceitando esse trade-off por ser o único intervalo com efeito real.

## Função nova (`client/src/config/gameConfig.ts`)

```ts
function currentRoachCap(survivalMs: number): number
```

- **Entrada**: `survivalMs`, o tempo de sobrevivência decorrido na partida atual (mesmo valor já
  calculado uma vez por `tick()` e reaproveitado pelas outras duas curvas de dificuldade).
- **Saída**: um número inteiro, o teto de baratas ativas simultaneamente permitido neste instante.
  - Em `survivalMs = 0`: exatamente `ROACH_CAP_BASE`.
  - Em `survivalMs >= DIFFICULTY_RAMP_DURATION_MS`: exatamente `ROACH_CAP_MAX`.
  - Entre os dois: interpolação linear de `ROACH_CAP_BASE` para `ROACH_CAP_MAX`, arredondada para o
    inteiro mais próximo (`Math.round`) — única diferença estrutural frente às duas curvas de
    `specs/011`, que operam em milissegundos e não precisam arredondar.
- **Garantias**: pura (mesma entrada sempre produz a mesma saída), monotônica não-decrescente ao
  longo de `survivalMs`, nunca abaixo de `ROACH_CAP_BASE` nem acima de `ROACH_CAP_MAX`.

## Fluxo (ponto de chamada)

```
MatchStateManager.tick(now)
  survivalMs = elapsedMs(this.match, now)                      // já existe (specs/007, specs/011)
  roachCap = currentRoachCap(survivalMs)                        // NOVO
  candidates = presentFoodItemsWithoutActiveRoach(this.match)   // já existe (specs/001)
  └── candidates.length > 0 && activeRoaches.length < roachCap  // condição de spawn ganha 1 termo novo
      → cria a nova Roach normalmente (inalterado)
```

Nenhuma seta acima cruza para `entities/Match.ts`, `entities/Roach.ts` ou `scenes/` — todas
permanecem exatamente como estão hoje; `presentFoodItemsWithoutActiveRoach` não muda, e o teto
explícito é aplicado como uma condição **adicional** (`&&`), nunca substituindo a checagem já
existente de comidas disponíveis (preserva FR-006/FR-021 por construção, `research.md` §2).

## Estado — nenhum novo em `Match`/`MatchSnapshot`

| Pergunta | Resposta |
|---|---|
| Onde vive o teto entre chamadas? | Em lugar nenhum — é recalculado a cada `tick()` a partir de `survivalMs`, nunca armazenado |
| Existe um campo `roachCap` em `Match`/`MatchSnapshot`? | Não, e não é necessário para nenhum requisito do spec |
| O teto é resetado por `start()`/`restart()`? | Sim, automaticamente — `survivalMs` volta a `0` porque `match.startedAt` é redefinido (mesmo mecanismo de `specs/011`, sem código dedicado) |
| O teto avança durante a pausa? | Não — `survivalMs` já é calculado a partir do `now` corrigido por pausa (`specs/009-pausar-partida`), mesmo mecanismo de `specs/011` |
| O teto é exposto em alguma UI/HUD? | Não (`## Clarifications` do `spec.md`, FR-012) — nenhuma scene lê `currentRoachCap` |
| O teto pode fazer o número de baratas ativas exceder o número de comidas presentes? | Não, nunca — a condição `candidates.length > 0` já impede isso independentemente do valor do teto (FR-006) |
