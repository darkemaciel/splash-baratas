# Contrato: Seleção do Ponto de Spawn

Este projeto não expõe API externa — o "contrato" aqui é a interface interna entre
`config/gameConfig.ts` (dados + funções puras) e `systems/MatchStateManager.ts` (único chamador),
que substitui o contrato implícito de `nearestSpawnPoint` hoje.

## `nearestSpawnRegion(target: Point): SpawnRegion`

- **Entrada**: posição do alvo (retorno de `foodItemPosition`).
- **Saída**: uma de `"top" | "bottom" | "left" | "right"`.
- **Garantias**:
  - Pura e determinística — mesma entrada sempre produz a mesma região (sem `Math.random()`).
  - Para qualquer `target` dentro do grid de prateleiras/comidas do MVP (specs/001), retorna
    exatamente a mesma região que `nearestSpawnPoint(target)` retornaria hoje como "o ponto mais
    próximo" (equivalência de comportamento, FR-003 do spec).

## `spawnPointCandidates(target: Point): readonly Point[]`

- **Entrada**: posição do alvo.
- **Saída**: array de exatamente 3 `Point`, todos fora da área de prateleiras/comidas (FR-002).
- **Garantias**: `== SPAWN_POINTS_BY_REGION[nearestSpawnRegion(target)]` — nunca retorna array vazio
  nem candidatos de mais de uma região.

## `pickSpawnPoint(candidates: readonly Point[], avoid?: Point): Point`

- **Entradas**:
  - `candidates`: array não-vazio de `Point` (na prática, sempre o retorno de
    `spawnPointCandidates`).
  - `avoid` (opcional): o `Point` a evitar repetir, se houver um spawn anterior conhecido para o
    mesmo alvo (FR-005).
- **Saída**: um `Point` pertencente a `candidates`.
- **Garantias**:
  - Se `avoid` for `undefined`, ou `candidates.length <= 1`, ou `avoid` não pertencer a
    `candidates`: sorteia uniformemente entre todos os itens de `candidates`.
  - Caso contrário (há `avoid` presente em `candidates` e `candidates.length > 1`): sorteia
    uniformemente entre `candidates` excluindo `avoid` — o retorno nunca é `avoid` nesse caso.
  - Não lança exceção para `candidates` com 1 único elemento (retorna esse elemento sempre,
    ignorando `avoid` — cobre o Edge Case do spec sobre "região com um único candidato").
  - Impura apenas quanto à fonte de aleatoriedade (`Math.random()`); não tem outros efeitos
    colaterais e não lê/escreve estado fora dos parâmetros recebidos.

## Chamador (`MatchStateManager.tick()`)

- DEVE chamar `spawnPointCandidates(targetPosition)` e `pickSpawnPoint(candidates, avoid)` **antes**
  de `createRoach(...)`, passando o resultado como o parâmetro `spawnPoint` já existente de
  `createRoach` — nenhuma mudança de assinatura em `createRoach`/`Roach`.
- DEVE atualizar `lastSpawnPointByTarget.set(target.id, spawnPoint)` logo após escolher o ponto, e
  limpar o `Map` inteiro em `start()`/`restart()` (mesmo ciclo de vida de `lastSpawnAt`).
- NÃO DEVE persistir `lastSpawnPointByTarget` em `MatchSnapshot` — é bookkeeping interno, não estado
  observável pela UI.
