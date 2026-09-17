# Data Model: Variação nos Pontos de Spawn

Esta feature não introduz nenhuma entidade de domínio nova nem altera os campos de `Match`,
`FoodItem`, `Shelf`, `Roach` ou `MatchSnapshot` (documentados em
`specs/001-roach-fridge-clicker/data-model.md` e estendidos pelas features seguintes). `Roach`
continua tendo um único campo `spawnPoint: Point` — de onde exatamente esse `Point` veio (qual
região, qual dos 3 candidatos) deixa de importar assim que a barata é criada.

## Conceitos novos (configuração + seleção, não entidades de domínio)

### `SpawnRegion`

```ts
export type SpawnRegion = "top" | "bottom" | "left" | "right";
```

Substitui o papel que os 4 `SPAWN_POINTS` individuais tinham hoje: cada região representa "o lado da
tela pelo qual uma barata pode entrar para alvos daquele lado". Não é persistido em nenhum lugar —
existe apenas como valor de retorno intermediário de `nearestSpawnRegion`.

### `SPAWN_POINTS_BY_REGION: Record<SpawnRegion, readonly Point[]>`

Substitui `SPAWN_POINTS` (array plano de 4 `Point`). Cada região passa a ter 3 candidatos (ver
`research.md` §1–2), definidos como frações de `GAME_WIDTH`/`GAME_HEIGHT` com a mesma margem de
40px fora da tela já usada hoje. O ponto central de cada região é idêntico ao ponto único que existe
atualmente para aquele lado.

| Região | Candidatos (fração de GAME_WIDTH/GAME_HEIGHT) |
|---|---|
| `top` | `(25%, -40)`, `(50%, -40)`, `(75%, -40)` |
| `bottom` | `(25%, H+40)`, `(50%, H+40)`, `(75%, H+40)` |
| `left` | `(-40, 25%)`, `(-40, 50%)`, `(-40, 75%)` |
| `right` | `(W+40, 25%)`, `(W+40, 50%)`, `(W+40, 75%)` |

### Funções puras (`client/src/config/gameConfig.ts`)

| Função | Assinatura | Papel |
|---|---|---|
| `nearestSpawnRegion` | `(target: Point) => SpawnRegion` | Substitui `nearestSpawnPoint`; decide a região coerente com o alvo usando a mesma distância euclidiana às 4 âncoras originais (research.md §3) |
| `spawnPointCandidates` | `(target: Point) => readonly Point[]` | Atalho = `SPAWN_POINTS_BY_REGION[nearestSpawnRegion(target)]` |
| `pickSpawnPoint` | `(candidates: readonly Point[], avoid?: Point) => Point` | Sorteia um candidato, excluindo `avoid` quando há mais de 1 opção (research.md §4) |

Todas puras (sem `import Phaser`, sem efeito colateral) — mesma categoria de `nearestSpawnPoint`/
`foodItemPosition` hoje, preservando o Princípio I.

## Estado novo em `MatchStateManager` (bookkeeping, não domínio)

| Campo | Tipo | Ciclo de vida |
|---|---|---|
| `lastSpawnPointByTarget` | `Map<string, Point>` (chave: `targetFoodItemId`) | Criado vazio; atualizado a cada spawn com o ponto escolhido para aquele alvo; limpo em `start()`/`restart()` — mesmo ciclo de `lastSpawnAt` |

Não é exposto em `MatchSnapshot` — é puramente interno ao algoritmo de spawn, do mesmo jeito que
`lastSpawnAt` já é hoje.

## Fluxo (substitui o trecho relevante de `MatchStateManager.tick()`)

```
tick(now)
  └── (a cada SPAWN_INTERVAL_MS, se houver alvo elegível)
        targetPosition = foodItemPosition(shelfIndex, slotIndex)   // já existe
        candidates     = spawnPointCandidates(targetPosition)       // NOVO (substitui nearestSpawnPoint)
        avoid          = lastSpawnPointByTarget.get(target.id)      // NOVO
        spawnPoint     = pickSpawnPoint(candidates, avoid)          // NOVO
        lastSpawnPointByTarget.set(target.id, spawnPoint)           // NOVO
        roach          = createRoach(..., spawnPoint, now, TRAVEL_DURATION_MS)  // já existe, campo inalterado
```

Nenhuma seta acima cruza para `entities/Roach.ts` — `createRoach`/`positionAt`/`progress` continuam
recebendo e devolvendo exatamente o mesmo formato de `Point` de antes (Princípio I).
