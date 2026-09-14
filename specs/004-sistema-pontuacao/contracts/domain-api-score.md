# Contract: API interna Domínio ↔ Renderização — Sistema de Pontuação

Extensão do contrato existente em `specs/001-roach-fridge-clicker/contracts/domain-api.md` e
`specs/002-hud-progresso-risco/contracts/domain-api-hud.md`. A regra continua a mesma: `GameScene`
e `GameOverScene` só podem ler pontuação através de `MatchSnapshot`/métodos públicos do
`MatchStateManager`, nunca recalculando pontos por conta própria (Princípios I e II).

## Novos campos em `Match` — `entities/Match.ts`

```ts
export interface Match {
  // ...campos existentes (shelves, foodItems, activeRoaches, status)
  score: number;
  comboStreak: number;
  lastEliminationAt: number | null;
}
```

## Novas funções puras — `entities/Match.ts`

| Função | Assinatura | Efeito |
|---|---|---|
| `reactionBonusPoints(reactionMs)` | `(number) => number` | Bônus de velocidade por faixa (ver `data-model.md`). Pura, sem efeitos colaterais. |
| `comboBonusPoints(comboStreakAfterIncrement)` | `(number) => number` | Bônus de combo linear (ver `data-model.md`). Pura. |
| `applyEliminationScore(match, now, spawnedAt)` | `(Match, number, number) => number` | Muta `match.score`/`comboStreak`/`lastEliminationAt`; retorna os pontos ganhos nesta eliminação. |
| `resetComboStreak(match)` | `(Match) => void` | Zera `match.comboStreak`. |

Nenhuma dessas funções aceita ou retorna tipos do Phaser; todas são testáveis isoladamente via
`bun test`, sem depender de `MatchStateManager` nem de qualquer `Scene`.

## Extensão de `MatchSnapshot` — `systems/MatchStateManager.ts`

```ts
export interface MatchSnapshot {
  // ...campos existentes (shelves, foodItems, activeRoaches, status, foodRemainingCount, foodTotalCount, riskLevel)
  readonly score: number;
}
```

## Extensão de `MatchStateManager` — `systems/MatchStateManager.ts`

| Método | Assinatura | Efeito |
|---|---|---|
| `tryEliminateRoach(roachId, clientTimestamp)` | (existente, comportamento estendido) | Ao eliminar com sucesso, chama `applyEliminationScore(match, clientTimestamp, roach.spawnedAt)` **antes** de remover a barata e emitir `roach:eliminated`. O payload do evento não muda (`{ roachId }`) — a pontuação é lida via `getSnapshot().score` pelo assinante. |
| `tick(now)` | (existente, comportamento estendido) | No branch de `food:stolen` (roubo de comida), chama `resetComboStreak(match)` antes de emitir o evento, incondicionalmente. |
| `registerMissedClick()` | `() => void` **(novo)** | Chama `resetComboStreak(match)`. Não emite nenhum evento novo — não há necessidade de notificar assinantes, já que nenhum estado observável muda além do combo interno. |

## Uso esperado pela camada de renderização

- `GameScene.create()` cria um novo `Phaser.GameObjects.Text` (`scoreText`) uma única vez, lendo o
  snapshot inicial (pós `match:started`, `score === 0`) para o estado inicial, posicionado junto ao
  HUD de progresso/risco já existente (specs/002), sem sobrepor prateleiras/comidas/baratas.
- `GameScene` assina o evento já existente `roach:eliminated` para reler
  `matchStateManager.getSnapshot().score` e atualizar `scoreText` — nenhum evento novo é criado
  (FR-009).
- `GameScene.handlePointerDown()`, no branch onde `pickTopmostHit` retorna `undefined` (mesmo
  branch que hoje toca `sfx-miss`), passa a também chamar `matchStateManager.registerMissedClick()`.
- `GameOverScene.create()` lê `matchStateManager.getSnapshot().score` uma vez e exibe como texto
  estático (FR-010) — não assina nenhum evento, já que a pontuação não muda mais após a derrota.
- Nenhuma das duas scenes (`GameScene`, `GameOverScene`) lê ou escreve `comboStreak`/
  `lastEliminationAt` diretamente — esses campos são detalhes internos de cálculo, não exibidos
  no MVP desta feature (spec.md, Assumptions).
