# Contrato: Curva de Dificuldade

Este projeto não expõe API externa — o "contrato" aqui é a interface interna entre
`config/gameConfig.ts` (funções puras) e `systems/MatchStateManager.ts` (único chamador), que
substitui o contrato implícito de `SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS` hoje.

## `currentSpawnIntervalMs(survivalMs: number): number`

- **Entrada**: `survivalMs`, o tempo de sobrevivência decorrido na partida atual (`elapsedMs(match, now)`),
  sempre `>= 0`.
- **Saída**: o intervalo, em ms, que deve decorrer antes do próximo spawn ser permitido.
- **Garantias**:
  - Pura e determinística — mesma entrada sempre produz a mesma saída (sem `Math.random()`,
    sem leitura de estado externo).
  - `currentSpawnIntervalMs(0) === SPAWN_INTERVAL_BASE_MS` exatamente.
  - Para todo `survivalMs >= DIFFICULTY_RAMP_DURATION_MS`, `currentSpawnIntervalMs(survivalMs) ===
    SPAWN_INTERVAL_FLOOR_MS` exatamente.
  - Monotônica não-crescente: para `a <= b`, `currentSpawnIntervalMs(a) >=
    currentSpawnIntervalMs(b)` — a dificuldade nunca "recua" com o tempo dentro da mesma partida.
  - Nunca retorna um valor menor que `SPAWN_INTERVAL_FLOOR_MS` nem maior que
    `SPAWN_INTERVAL_BASE_MS`, para nenhuma entrada não-negativa.

## `currentTravelDurationMs(survivalMs: number): number`

- Mesmas garantias de `currentSpawnIntervalMs`, trocando `SPAWN_INTERVAL_BASE_MS`/
  `SPAWN_INTERVAL_FLOOR_MS` por `TRAVEL_DURATION_BASE_MS`/`TRAVEL_DURATION_FLOOR_MS`.

## Chamador (`MatchStateManager.tick(now)`)

- DEVE calcular `survivalMs = elapsedMs(this.match, now)` uma única vez por chamada de `tick()`, e
  usar o mesmo valor para as duas funções acima — nunca recalcular `elapsedMs` duas vezes com `now`
  potencialmente diferentes dentro do mesmo `tick()`.
- DEVE usar `currentSpawnIntervalMs(survivalMs)` no lugar da leitura direta de
  `SPAWN_INTERVAL_BASE_MS` na condição de cadência (`now - this.lastSpawnAt >= ...`).
- DEVE usar `currentTravelDurationMs(survivalMs)` no lugar da leitura direta de
  `TRAVEL_DURATION_BASE_MS` ao chamar `createRoach(...)`.
- NÃO DEVE recalcular ou alterar `travelDurationMs` de uma barata já criada — o valor passado a
  `createRoach` no momento do spawn é definitivo para aquela barata (contrato já garantido por
  `entities/Roach.ts`, inalterado por esta feature).
- NÃO DEVE introduzir nenhum campo novo em `Match`/`MatchSnapshot` para armazenar o "nível de
  dificuldade" — ele nunca precisa ser lido fora de `tick()`.
