# Contract: API interna Domínio ↔ Renderização — Cronômetro de Tempo de Sobrevivência

Extensão do contrato existente em `specs/001-roach-fridge-clicker/contracts/domain-api.md` e
`specs/004-sistema-pontuacao/contracts/domain-api-score.md`. A regra continua a mesma: `GameScene`
e `GameOverScene` só podem ler o tempo decorrido através de `MatchSnapshot` + as funções puras
abaixo, nunca recalculando timestamps por conta própria (Princípios I e II).

## Novos campos em `Match` — `entities/Match.ts`

```ts
export interface Match {
  // ...campos existentes (shelves, foodItems, activeRoaches, status, score, comboStreak, lastEliminationAt)
  startedAt: number;
  endedAt: number | null;
}
```

## Assinatura estendida de `createMatch` — `entities/Match.ts`

```ts
export function createMatch(now: number = Date.now()): Match;
```

Compatível com todos os call sites existentes que já chamam `createMatch()` sem argumentos
(research.md §2) — comportamento novo só é observado por quem passar `now` explicitamente.

## Novas funções puras — `entities/Match.ts`

| Função | Assinatura | Efeito |
|---|---|---|
| `elapsedMs(match, now)` | `(Pick<Match, "startedAt" \| "endedAt">, number) => number` | Retorna `(endedAt ?? now) - startedAt`. Pura, sem efeitos colaterais. Aceita `Match` ou `MatchSnapshot` diretamente. |
| `formatElapsedTime(ms)` | `(number) => string` | Formata como `"MM:SS"` zero-padded (ver `data-model.md`). Pura. |

Nenhuma dessas funções aceita ou retorna tipos do Phaser; ambas são testáveis isoladamente via
`bun test`, sem depender de `MatchStateManager` nem de qualquer `Scene`.

## Extensão de `MatchSnapshot` — `systems/MatchStateManager.ts`

```ts
export interface MatchSnapshot {
  // ...campos existentes (shelves, foodItems, activeRoaches, status, foodRemainingCount, foodTotalCount, riskLevel, score)
  readonly startedAt: number;
  readonly endedAt: number | null;
}
```

## Extensão de `MatchStateManager` — `systems/MatchStateManager.ts`

| Método | Assinatura | Efeito |
|---|---|---|
| `start(now)` | (existente, comportamento estendido) | `createMatch(now)` passa a fixar `startedAt = now`, `endedAt = null` no novo `Match`. Nenhuma mudança de assinatura ou de eventos emitidos. |
| `restart(now)` | (existente, sem mudança) | Delega para `start(now)` — `startedAt`/`endedAt` resetam automaticamente (FR-006). |
| `tick(now)` | (existente, comportamento estendido) | No branch onde `allFoodStolen(this.match)` se torna verdadeiro, define `this.match.endedAt = now` **antes** de definir `status = 'lost'` e emitir `match:lost`. Nenhum campo novo no payload do evento — o valor é lido via `getSnapshot().endedAt` pelo assinante. |

Nenhum método novo é adicionado ao `MatchStateManager` — a leitura do tempo decorrido usa
diretamente a função pura `elapsedMs` sobre os campos já expostos em `MatchSnapshot`
(research.md §3), em vez de um método dedicado como `getElapsedMs(now)`.

## Uso esperado pela camada de renderização

- `GameScene.create()` cria um novo `Phaser.GameObjects.Text` (`timerText`) uma única vez, ancorado
  no canto superior esquerdo (espelhando a vida/pontuação já ancoradas no canto superior direito),
  com o valor inicial `formatElapsedTime(elapsedMs(snapshot, now))` (`"00:00"` logo após
  `match:started`).
- `GameScene.update()` recalcula `elapsedMs(matchStateManager.getSnapshot(), this.time.now)` a cada
  frame, mas só chama `timerText.setText(...)` quando o segundo inteiro exibido muda em relação ao
  último valor renderizado (research.md §7) — nenhum evento novo é criado ou assinado para isso.
- `GameOverScene.create()` lê `matchStateManager.getSnapshot()` uma vez, calcula
  `formatElapsedTime(elapsedMs(snapshot, this.time.now))` — como `endedAt` já está definido nesse
  ponto, o `now` passado é ignorado pelo cálculo — e exibe como texto estático (FR-005), ao lado da
  pontuação final já existente (specs/004). Não assina nenhum evento, já que o valor não muda mais
  após a derrota.
- Nenhuma das duas scenes (`GameScene`, `GameOverScene`) lê ou escreve `startedAt`/`endedAt`
  diretamente para qualquer outro fim além de chamar `elapsedMs` — esses campos são detalhes
  internos de cálculo, não exibidos diretamente no MVP desta feature.
