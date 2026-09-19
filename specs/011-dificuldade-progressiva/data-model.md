# Data Model: Dificuldade Progressiva

Esta feature não introduz nenhuma entidade de domínio nova nem altera os campos de `Match`,
`FoodItem`, `Shelf`, `Roach` ou `MatchSnapshot` (documentados em
`specs/001-roach-fridge-clicker/data-model.md` e estendidos pelas features seguintes). O "nível de
dificuldade" descrito no `spec.md` (Key Entities) é inteiramente derivado de `match.startedAt`/
`match.endedAt`, já existentes — nenhum campo novo é adicionado a `Match`/`Roach`/`MatchSnapshot`.

## Constantes renomeadas/adicionadas (`client/src/config/gameConfig.ts`)

| Antes | Depois | Papel |
|---|---|---|
| `SPAWN_INTERVAL_MS` (2500, fixo) | `SPAWN_INTERVAL_BASE_MS` (2500) | Cadência de spawn no início de qualquer partida (`survivalMs=0`) |
| — | `SPAWN_INTERVAL_FLOOR_MS` (1200) | Cadência mínima, alcançada e nunca ultrapassada a partir de `DIFFICULTY_RAMP_DURATION_MS` |
| `TRAVEL_DURATION_MS` (3000, fixo) | `TRAVEL_DURATION_BASE_MS` (3000) | Tempo de viagem de qualquer barata criada em `survivalMs=0` |
| — | `TRAVEL_DURATION_FLOOR_MS` (2000) | Tempo de viagem mínimo, alcançado e nunca ultrapassado a partir de `DIFFICULTY_RAMP_DURATION_MS` |
| — | `DIFFICULTY_RAMP_DURATION_MS` (180000) | Tempo de sobrevivência em que a curva atinge o piso |

Os nomes antigos deixam de existir — não são mantidos como aliases (Princípio IV: sem shims de
compatibilidade desnecessários; há só 4 chamadores em todo o código, todos identificados em
`research.md` §6).

## Funções puras (`client/src/config/gameConfig.ts`)

| Função | Assinatura | Papel |
|---|---|---|
| `currentSpawnIntervalMs` | `(survivalMs: number) => number` | Interpolação linear de `SPAWN_INTERVAL_BASE_MS` para `SPAWN_INTERVAL_FLOOR_MS` ao longo de `DIFFICULTY_RAMP_DURATION_MS` (research.md §1) |
| `currentTravelDurationMs` | `(survivalMs: number) => number` | Mesma interpolação, de `TRAVEL_DURATION_BASE_MS` para `TRAVEL_DURATION_FLOOR_MS` |

Ambas puras (sem `import Phaser`, sem efeito colateral, sem aleatoriedade) — mesma categoria de
`foodItemPosition`/`spawnPointCandidates` hoje, preservando o Princípio I. Compartilham a mesma
lógica de progresso (`t = clamp(survivalMs / DIFFICULTY_RAMP_DURATION_MS, 0, 1)`), mas continuam
duas funções independentes — cada uma com seu próprio par base/piso — para manter FR-001 e FR-002
como requisitos e testes separados (spec.md, US1/US2).

## Fluxo (substitui o trecho relevante de `MatchStateManager.tick()`)

```
tick(now)
  survivalMs = elapsedMs(this.match, now)                        // NOVO — já existia em Match.ts
  spawnIntervalMs = currentSpawnIntervalMs(survivalMs)            // NOVO (substitui SPAWN_INTERVAL_MS)
  └── (a cada spawnIntervalMs, se houver alvo elegível)
        travelDurationMs = currentTravelDurationMs(survivalMs)    // NOVO (substitui TRAVEL_DURATION_MS)
        targetPosition = foodItemPosition(shelfIndex, slotIndex)  // já existe
        candidates     = spawnPointCandidates(targetPosition)      // já existe (specs/010)
        spawnPoint     = pickSpawnPoint(candidates, avoid)         // já existe (specs/010)
        roach          = createRoach(..., spawnPoint, now, travelDurationMs)  // campo já existente, valor agora dinâmico
```

Nenhuma seta acima cruza para `entities/Roach.ts` — `createRoach`/`positionAt`/`progress` continuam
recebendo e devolvendo exatamente o mesmo formato de dados de antes; `travelDurationMs` é só mais um
número, agora calculado por uma função em vez de lido de uma constante (Princípio I).

## Estado — nenhum novo

| Pergunta | Resposta |
|---|---|
| Onde vive o "nível de dificuldade" da partida atual? | Em lugar nenhum — é recalculado a cada `tick()` a partir de `match.startedAt`/`match.endedAt` |
| Existe algum campo `difficultyLevel` em `Match`/`MatchSnapshot`? | Não, e não é necessário para nenhum requisito do spec |
| O que acontece com o nível de dificuldade ao pausar? | Nada de especial — `logicalNow()` (specs/009) já desconta o tempo pausado antes de chegar em `elapsedMs`/`tick()` |
| O que acontece com o nível de dificuldade ao reiniciar? | Volta a `survivalMs=0` (dificuldade base) porque `start()`/`restart()` já redefinem `match.startedAt = now` |
| Uma barata já em voo é afetada por uma mudança de dificuldade? | Não — `travelDurationMs` é fixado no momento de `createRoach` e nunca recalculado depois |
