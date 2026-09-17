# Data Model: Cronômetro de Tempo de Sobrevivência

Estende o `Match` já modelado em `specs/001-roach-fridge-clicker/data-model.md` (e lido via
`MatchSnapshot`, specs/002/004) com dois novos campos mutáveis e duas funções puras de cálculo.
Nenhuma nova entidade com identidade própria é introduzida — o "Tempo de Sobrevivência" descrito na
spec (seção Key Entities) é uma leitura derivada dos dois timestamps abaixo, nunca um valor
persistido.

## Campos adicionados a `Match` (`entities/Match.ts`)

| Campo | Tipo | Valor inicial | Notas |
|---|---|---|---|
| `startedAt` | `number` | `now` passado a `createMatch(now)` (default `Date.now()`) | Timestamp do início da partida corrente, na mesma escala de tempo já usada por `tick(now)`/`this.time.now` (FR-002). |
| `endedAt` | `number \| null` | `null` | Timestamp em que a condição de derrota foi atingida; `null` enquanto a partida está `'playing'` ou `'notStarted'`. Definido uma única vez, no `tick()` que esgota a última comida (FR-004). |

**Regras de validação**:
- `startedAt` é definido exatamente uma vez por partida, na criação (`createMatch`/`createEmptyMatch`)
  — nunca alterado por `tick()`.
- `endedAt` transiciona de `null` para um número exatamente quando `Match.status` transiciona para
  `'lost'`, no mesmo `tick(now)` (mesmo `now`) — nunca antes, nunca atualizado depois.
- `startedAt`/`endedAt` voltam aos valores iniciais sempre que `Match` é recriado (`createMatch`),
  incluindo reinícios (FR-006) — nunca por atualização parcial.

## Funções puras adicionadas (`entities/Match.ts`)

| Função | Assinatura | Efeito |
|---|---|---|
| `elapsedMs` | `(match: Pick<Match, "startedAt" \| "endedAt">, now: number) => number` | Retorna `(endedAt ?? now) - startedAt`, nunca negativo. Aceita qualquer objeto com o formato mínimo (`Match` ou `MatchSnapshot` servem), não exige a instância completa de `Match`. |
| `formatElapsedTime` | `(ms: number) => string` | Formata milissegundos como `"MM:SS"` (zero-padded, sem rollover para horas — research.md §6). |

**Regras de validação**:
- `elapsedMs` é uma função pura sem efeitos colaterais, exercitável isoladamente com qualquer par
  `{ startedAt, endedAt }`/`now`, sem precisar de uma instância completa de `Match`.
- Uma vez que `endedAt` não é `null`, `elapsedMs` ignora o `now` recebido — o valor retornado é
  sempre o mesmo (FR-005: tempo final estático).
- `formatElapsedTime` nunca lança exceção para `ms >= 0`; não trata `ms` negativo (não ocorre em uso
  normal, já que `elapsedMs` nunca retorna negativo).

## Extensão de `MatchSnapshot` (`systems/MatchStateManager.ts`)

| Campo | Tipo | Cálculo | Notas |
|---|---|---|---|
| `startedAt` | `number` | `match.startedAt` (cópia direta) | Bruto, não pré-calculado — a scene chama `elapsedMs(snapshot, now)` diretamente (research.md §3). |
| `endedAt` | `number \| null` | `match.endedAt` (cópia direta) | Idem. |

## Relações

```
Match 1───1 startedAt   [mutável, definido só na criação (createMatch)]
Match 1───1 endedAt     [mutável, null → number, definido só por tick() na transição para 'lost']
                        [ambos resetados juntos em qualquer recriação de Match]
```

Nenhuma alteração é feita em `FoodItem`, `Shelf`, `Roach`, `RiskLevel`, `score`/`comboStreak` ou nas
transições de `Match.status` já documentadas em specs 001/002/004 — esta feature é estritamente
aditiva.

## Impacto em testes existentes

O helper `matchWithRemaining` em `client/tests/unit/match.hud.test.ts` constrói um objeto `Match`
por literal (`{ shelves, foodItems, activeRoaches, status, score, comboStreak, lastEliminationAt }`)
e precisa passar a incluir `startedAt: 0, endedAt: null` para continuar compilando, já que esses
campos passam a ser obrigatórios na interface `Match`. Nenhum teste existente depende do *valor*
desses campos — apenas da forma do objeto. `client/tests/unit/match.score.test.ts` não precisa de
nenhuma mudança: todos os seus call sites de `createMatch()` continuam válidos porque `now` é
opcional (research.md §2).
