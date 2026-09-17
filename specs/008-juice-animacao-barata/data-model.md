# Data Model: Juice na Animação da Barata

Esta feature não introduz nem altera nenhuma entidade de domínio. `Match`, `FoodItem`, `Roach`,
`Shelf` e `MatchSnapshot` (documentados em `specs/001-roach-fridge-clicker/data-model.md` e
estendidos pelas features seguintes) permanecem exatamente como estão — nenhum campo novo é
adicionado a `Roach`/`MatchSnapshot`, e nenhum evento novo é adicionado a
`MatchEventName`/`MatchEventPayloads` em `MatchStateManager.ts`.

O único "modelo" novo desta feature é um par de funções derivadas, puramente de apresentação, que
leem `progress(roach, now)` (já existente) e o `now` corrente para produzir valores visuais
efêmeros — não é estado mutável, não é persistido, não é lido de volta por nenhuma regra de jogo ou
pelo hit-testing.

## Efeito de Squash/Stretch (derivado)

Escala visual aplicada ao sprite da barata, recalculada a cada frame — nunca armazenada.

| Entrada | Origem | Saída | Faixa |
|---|---|---|---|
| `progress(roach, now)` | `entities/Roach.ts` (já existente) | `scaleX`, `scaleY` | `scaleX ∈ [1 - 0.18, 1 + 0.18]`, `scaleY` espelhado inverso |
| `now` (`this.time.now`) | Relógio da `Scene` (Phaser) | fase de oscilação (`wobble`) | contínua |
| `roach.id` | `entities/Roach.ts` (já existente) | offset de fase determinístico | `[0, 2π)` |

**Regras de validação**:
- Em `progress === 0` (spawn), `scaleX = scaleY = 1` (nenhuma deformação) — satisfaz o Edge Case
  "efeito quase imperceptível no spawn".
- `scaleX` e `scaleY` nunca divergem além de `±SQUASH_STRETCH_MAX_DELTA` (0.18) do valor neutro
  (1), mesmo em `progress = 1`.

## Efeito de Tremor/Shake (derivado)

Deslocamento visual somado à posição real do sprite da barata, recalculado a cada frame — nunca
armazenado, e nunca lido por `CollisionSystem.pickTopmostHit` ou `handlePointerDown`.

| Entrada | Origem | Saída | Faixa |
|---|---|---|---|
| `progress(roach, now)` | `entities/Roach.ts` (já existente) | `dx`, `dy` (px) | `[-4, 4]` (`TREMOR_MAX_OFFSET_PX`) |
| `now` (`this.time.now`) | Relógio da `Scene` (Phaser) | frequência de oscilação | `6 Hz` a `14 Hz`, cresce com `progress` |
| `roach.id` | `entities/Roach.ts` (já existente) | offset de fase determinístico | `[0, 2π)` |

**Regras de validação**:
- Em `progress === 0` (spawn), `dx = dy = 0` — nenhum deslocamento.
- `dx`/`dy` nunca excedem `±TREMOR_MAX_OFFSET_PX` (4px) em nenhum instante, valor menor que
  `HITBOX_PADDING_PX` (6px, `gameConfig.ts`) — o pior caso de divergência visual entre sprite e
  posição real de clique fica dentro da margem de padding já existente.
- O deslocamento é somado à posição retornada por `positionAt(roach, now, targetPosition)` apenas
  para fins de desenho (`sprite.setPosition`) — a posição usada para hit-testing
  (`handlePointerDown`, `CollisionSystem.pickTopmostHit`) continua sendo `positionAt(...)` sem
  nenhum offset (FR-004).

## Fase por barata (determinística, não armazenada)

| Entrada | Saída | Notas |
|---|---|---|
| `roach.id` (string) | valor em radianos `[0, 2π)` | Função pura, recalculada a cada chamada a partir do `id` — nenhum `Map` ou campo novo é criado para guardar a fase (Princípio II) |

## Relações

```
entities/Roach.ts: progress(roach, now)   ──┐
                                              ├──> GameScene.syncRoachSprites() ──> sprite.setScale()   (squash/stretch)
entities/Roach.ts: positionAt(...)        ──┤                                  └──> sprite.setPosition() (posição real + tremor)
                                              │
GameScene.handlePointerDown()             ──┴──> positionAt(...) direto (SEM tremor/squash) ──> CollisionSystem.pickTopmostHit
```

Nenhuma seta acima cruza de volta para o domínio — o fluxo é estritamente unidirecional
(domínio → apresentação visual), preservando os Princípios I e II. O caminho de hit-testing
(`handlePointerDown`) nunca passa pelos cálculos de squash/stretch/tremor.
