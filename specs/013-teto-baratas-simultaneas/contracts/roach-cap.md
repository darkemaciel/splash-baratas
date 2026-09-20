# Contrato: Teto de Baratas Simultâneas

Este projeto não expõe API externa — o "contrato" aqui é a interface interna entre
`config/gameConfig.ts` (função pura nova) e `systems/MatchStateManager.ts` (único chamador),
que passa a complementar (nunca substituir) a checagem já existente de
`presentFoodItemsWithoutActiveRoach` (FR-021 da `specs/001-roach-fridge-clicker`).

## `currentRoachCap(survivalMs: number): number`

- **Entrada**: `survivalMs`, o tempo de sobrevivência decorrido na partida atual
  (`elapsedMs(match, now)`), sempre `>= 0` — o mesmo valor já calculado uma única vez por `tick()`
  para `currentSpawnIntervalMs`/`currentTravelDurationMs` (`specs/011-dificuldade-progressiva`).
- **Saída**: um número inteiro, o teto de baratas ativas simultaneamente permitido neste instante.
- **Garantias**:
  - Pura e determinística — mesma entrada sempre produz a mesma saída (sem `Math.random()`, sem
    leitura de estado externo).
  - `currentRoachCap(0) === ROACH_CAP_BASE` exatamente.
  - Para todo `survivalMs >= DIFFICULTY_RAMP_DURATION_MS`, `currentRoachCap(survivalMs) ===
    ROACH_CAP_MAX` exatamente.
  - Monotônica não-decrescente: para `a <= b`, `currentRoachCap(a) <= currentRoachCap(b)` — o teto
    nunca "recua" com o tempo dentro da mesma partida (diferença deliberada frente às curvas de
    `specs/011`, que são não-crescentes — este eixo de dificuldade sobe em vez de descer).
  - Nunca retorna um valor menor que `ROACH_CAP_BASE` nem maior que `ROACH_CAP_MAX`, para nenhuma
    entrada não-negativa.
  - Sempre um inteiro (arredondado com `Math.round` nos pontos intermediários da rampa) — nunca uma
    contagem fracionária de baratas.

## Chamador (`MatchStateManager.tick(now)`)

- DEVE calcular `roachCap = currentRoachCap(survivalMs)` usando o mesmo `survivalMs` já calculado
  para `currentSpawnIntervalMs`/`currentTravelDurationMs` nesta mesma chamada de `tick()` — nunca
  recalcular `elapsedMs` de novo com um `now` potencialmente diferente.
- DEVE tratar `roachCap` como uma condição **adicional** à checagem já existente de
  `presentFoodItemsWithoutActiveRoach(this.match).length > 0`, nunca como substituta dela — uma nova
  `Roach` só é criada quando ambas as condições são verdadeiras
  (`candidates.length > 0 && this.match.activeRoaches.length < roachCap`). Isso preserva, sem
  nenhum código dedicado, a garantia de que o número de baratas ativas nunca excede o número de
  comidas presentes (FR-006/FR-021 da `specs/001-roach-fridge-clicker`), mesmo quando `roachCap`
  for maior que o número de comidas restantes.
- Quando a criação é impedida pelo teto (`activeRoaches.length >= roachCap`), NÃO DEVE enfileirar
  ou "compensar" a barata adiada mais tarde — assim que `activeRoaches.length` cair abaixo de
  `roachCap` (por eliminação ou por roubo de comida), a checagem de cadência já existente
  (`now - this.lastSpawnAt >= currentSpawnIntervalMs(survivalMs)`) volta a permitir spawn
  normalmente no próximo `tick()` em que a condição for verdadeira.
- NÃO DEVE introduzir nenhum campo novo em `Match`/`MatchSnapshot` para armazenar o teto vigente —
  ele nunca precisa ser lido fora de `tick()` (FR-012, sem exposição em UI/HUD).
