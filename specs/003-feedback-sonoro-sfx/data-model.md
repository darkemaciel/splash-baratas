# Data Model: Feedback Sonoro (SFX)

Esta feature não introduz nem altera nenhuma entidade de domínio. `Match`, `FoodItem`, `Roach`,
`Shelf` e `MatchSnapshot` (documentados em `specs/001-roach-fridge-clicker/data-model.md` e
estendidos por `specs/002-hud-progresso-risco/data-model.md`) permanecem exatamente como estão —
nenhum campo novo é adicionado a `MatchSnapshot`, e nenhum evento novo é adicionado a
`MatchEventName`/`MatchEventPayloads` em `MatchStateManager.ts`.

O único "modelo" novo desta feature é uma tabela de mapeamento estático entre eventos já existentes
(de domínio ou de input) e assets de áudio — não é estado mutável, não é persistido, e vive apenas
como constantes/chaves na camada de renderização (`scenes/`).

## SFX (efeito sonoro discreto)

Associação, avaliada a cada ocorrência, entre um evento já observável e um asset de áudio tocado
uma vez.

| Evento de origem | Onde já é observável | Asset | Chave de preload |
|---|---|---|---|
| Barata eliminada por clique | `MatchStateManager` evento `roach:eliminated` | `hit.mp3` | `sfx-hit` |
| Clique sem acertar nenhuma barata | Retorno de `pickTopmostHit` (`CollisionSystem`) dentro de `GameScene.handlePointerDown` | `miss.mp3` | `sfx-miss` |
| Barata rouba a comida-alvo | `MatchStateManager` evento `food:stolen` | `steal.mp3` | `sfx-steal` |

**Regras de validação**:
- Para um mesmo evento de clique, no máximo um SFX discreto de acerto/erro toca (FR-003) — são
  mutuamente exclusivos porque vêm do mesmo resultado de hit-test (`hit` truthy vs. `undefined`).
- Cada ocorrência do evento de origem produz exatamente uma reprodução; reproduções podem se
  sobrepor no tempo (FR-009), nunca substituem/cortam uma reprodução anterior do mesmo asset.

## Som ambiente (loop)

Estado derivado — nunca armazenado como contador próprio — que controla se `fly.mp3` está tocando.

| Campo (interno à `GameScene`) | Tipo | Derivado de | Notas |
|---|---|---|---|
| "há barata ativa em cena?" | `boolean` | `matchStateManager.getSnapshot().activeRoaches.length > 0` | Recalculado a cada `update()`, nunca armazenado como fonte de verdade separada (Princípio II) — apenas a última transição observada é guardada (`isFlyLoopActive`) para decidir se precisa chamar `play`/`stop`. |

**Regras de validação**:
- `fly.mp3` toca em loop se e somente se `activeRoaches.length > 0` no frame corrente.
- Nunca mais de uma instância de `fly.mp3` audível simultaneamente (FR-007) — apenas
  `play`/`stopByKey` são chamados nas transições de borda (0→>0 e >0→0), nunca a cada frame.
- Parado explicitamente no evento `match:lost`, independentemente do valor de
  `activeRoaches.length` naquele instante (edge case: partida perdida com baratas ainda ativas em
  cena).

## Asset reservado (fora de escopo)

| Asset | Status nesta feature |
|---|---|
| `walk.mp3` | Permanece em `client/public/assets/audio/` (Princípio VI); não é carregado nem referenciado por nenhuma chave de preload ou trigger (FR-011). Reservado para uma futura feature de locomoção "andando". |

## Relações

```
MatchStateManager (eventos: roach:eliminated, food:stolen)   ──┐
                                                                 ├──> GameScene ──> Phaser.Sound.SoundManager (sfx-hit, sfx-steal)
CollisionSystem.pickTopmostHit (retorno "sem hit")            ──┘                  └──> (sfx-miss)

MatchSnapshot.activeRoaches.length (lido a cada frame)         ──> GameScene ──> Phaser.Sound.SoundManager (sfx-fly, loop)
```

Nenhuma seta acima cruza de volta para o domínio — o fluxo é estritamente unidirecional
(domínio/input → apresentação sonora), preservando os Princípios I e II.
