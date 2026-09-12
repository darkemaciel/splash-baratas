# Data Model: Loop Principal — Baratas na Geladeira

Entidades de domínio puras (TypeScript, sem imports de `phaser`), derivadas de `spec.md` §Key
Entities e das decisões de `research.md`.

## FoodItem (Comida)

Representa um item de comida específico posicionado em uma prateleira.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `string` | identificador único dentro da partida |
| `shelfId` | `string` | prateleira a que pertence |
| `slotIndex` | `number` | posição do item dentro da prateleira (layout) |
| `state` | `'present' \| 'stolen'` | ver transições abaixo |

**Regras de validação**:
- `state` só pode ir de `'present'` para `'stolen'`, nunca o inverso na mesma partida (FR-008).
- Uma `FoodItem` com `state === 'stolen'` NÃO PODE ser escolhida como alvo de uma nova `Roach`
  (FR-009).
- É alvo de exatamente zero ou uma `Roach` ativa por vez.

**Transições de estado**:
```
present --(Roach alcança o alvo sem ser clicada)--> stolen
```

## Shelf (Prateleira)

Agrupamento de `FoodItem`s dentro da geladeira.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `string` | identificador único |
| `foodItemIds` | `string[]` | itens pertencentes a esta prateleira |

Uma `Match` contém 3 prateleiras, cada uma com 3 `FoodItem`s (research.md §2) — 9 no total.

## Roach (Barata)

Entidade que surge mirando uma `FoodItem` específica e se move até ela por um tempo fixo.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | `string` | identificador único dentro da partida |
| `targetFoodItemId` | `string` | alvo fixo desde o spawn (FR-004) — nunca reatribuído |
| `spawnPoint` | `{ x: number; y: number }` | ponto de entrada fixo na borda da cena (research.md §5) |
| `spawnedAt` | `number` (timestamp/tick) | usado para calcular posição interpolada e detectar chegada |
| `travelDurationMs` | `number` | fixo para todas as baratas da partida (research.md §3) |
| `state` | `'active' \| 'eliminated' \| 'reachedTarget'` | ver transições abaixo |

**Regras de validação**:
- `targetFoodItemId` DEVE referenciar uma `FoodItem` com `state === 'present'` no momento do
  spawn (FR-004, FR-009).
- Uma vez `'eliminated'` ou `'reachedTarget'`, a barata é removida da lista de baratas ativas da
  `Match` e cliques subsequentes na mesma posição não têm efeito (Edge Case da spec).
- Empate clique/chegada no mesmo instante resolve sempre a favor do clique (FR-017) →
  transição para `'eliminated'` tem prioridade sobre `'reachedTarget'` quando ambos ocorreriam no
  mesmo tick.

**Transições de estado**:
```
active --(clique válido do jogador antes da chegada)--> eliminated
active --(tempo de viagem esgotado sem clique)--> reachedTarget
```

## Match (Partida)

Representa uma sessão de jogo em andamento.

| Campo | Tipo | Notas |
|---|---|---|
| `shelves` | `Shelf[]` | fixas para a partida (3 prateleiras) |
| `foodItems` | `FoodItem[]` | 9 itens no total, estado mutável |
| `activeRoaches` | `Roach[]` | no máximo uma por `FoodItem` com `state === 'present'` (FR-021) |
| `status` | `'notStarted' \| 'playing' \| 'lost'` | ver transições abaixo |

**Regras de validação**:
- Não pode existir mais de uma `Roach` ativa mirando a mesma `FoodItem` (FR-009, Key Entities).
- `status` só transiciona para `'lost'` quando **todas** as `FoodItem`s tiverem `state ===
  'stolen'` (FR-010, SC-004) — verificado a cada roubo de comida.
- Enquanto `status === 'lost'`, nenhuma nova `Roach` pode ser adicionada a `activeRoaches`
  (FR-014).
- Reiniciar a partida (`status` volta a `'playing'`) recria `foodItems` com `state: 'present'` e
  `activeRoaches` vazio (FR-013).

**Transições de estado**:
```
notStarted --(jogador inicia partida na tela inicial)--> playing
playing --(última FoodItem transiciona para 'stolen')--> lost
lost --(jogador reinicia)--> playing  [nova instância de Match, não uma mutação da anterior]
```

## Relações

```
Match 1───N Shelf 1───N FoodItem
Match 1───N Roach  N───1 FoodItem (targetFoodItemId, 0 ou 1 Roach ativa por FoodItem)
```
