# Data Model: Sistema de Pontuação

Estende o `Match` já modelado em `specs/001-roach-fridge-clicker/data-model.md` (e lido via
`MatchSnapshot`, specs/002) com três novos campos mutáveis e um conjunto de funções puras de
cálculo. Nenhuma nova entidade com identidade própria é introduzida — pontuação e combo são
atributos do `Match`, análogos a `status`.

## Campos adicionados a `Match` (`entities/Match.ts`)

| Campo | Tipo | Valor inicial | Notas |
|---|---|---|---|
| `score` | `number` | `0` | Pontuação total acumulada da partida corrente. Nunca decresce (FR-001, FR-002, FR-003). |
| `comboStreak` | `number` | `0` | Nº de eliminações consecutivas bem-sucedidas na sequência atual, sem falha (FR-006). |
| `lastEliminationAt` | `number \| null` | `null` | Timestamp (`now`) da última eliminação pontuada; `null` antes da primeira eliminação da partida. Usado apenas para detectar estouro da janela de combo (research.md §4) — não exposto no HUD. |

**Regras de validação**:
- `score >= 0` sempre; só é incrementado, nunca decrementado, dentro de uma mesma partida.
- `comboStreak >= 0` sempre; resetado para `0` exatamente nos três gatilhos de FR-008 (roubo de
  comida, clique sem acerto, estouro da janela de tempo entre eliminações).
- `score` e `comboStreak` voltam a `0`, e `lastEliminationAt` volta a `null`, sempre que `Match` é
  recriado (`createMatch()`), incluindo reinícios (FR-011) — nunca por uma atualização parcial.

## Constantes de balanceamento (`gameConfig.ts`)

| Constante | Valor | Uso |
|---|---|---|
| `SCORE_BASE_POINTS` | `100` | Pontos fixos somados a cada eliminação válida (FR-002). |
| `REACTION_BONUS_TIERS` | `[{ maxMs: 500, bonus: 50 }, { maxMs: 1000, bonus: 25 }, { maxMs: 1500, bonus: 10 }]` | Faixas de bônus por tempo de reação, avaliadas em ordem crescente com limite inclusivo (`<=`); fora de todas as faixas → bônus `0` (FR-004, FR-005). |
| `COMBO_BONUS_STEP_POINTS` | `25` | Incremento de bônus por nível de combo além do primeiro acerto da sequência (FR-007). |
| `COMBO_WINDOW_MS` | `3000` | Tempo máximo entre duas eliminações consecutivas para a sequência continuar viva (FR-008c). Ajustado de 2000ms para 3000ms durante a implementação — ver research.md §4. |

## Funções puras adicionadas (`entities/Match.ts`)

| Função | Assinatura | Efeito |
|---|---|---|
| `reactionBonusPoints` | `(reactionMs: number) => number` | Retorna o bônus de velocidade correspondente à primeira faixa de `REACTION_BONUS_TIERS` cujo `maxMs >= reactionMs`, ou `0` se nenhuma faixa cobrir o valor. |
| `comboBonusPoints` | `(comboStreakAfterIncrement: number) => number` | Retorna `COMBO_BONUS_STEP_POINTS * max(0, comboStreakAfterIncrement - 1)`. |
| `applyEliminationScore` | `(match: Match, now: number, spawnedAt: number) => number` | Muta `match.score`/`match.comboStreak`/`match.lastEliminationAt`; retorna o total de pontos ganhos nesta eliminação (base + bônus de reação + bônus de combo). Reseta `comboStreak` antes de incrementar se a janela de combo (`COMBO_WINDOW_MS`) tiver estourado desde `lastEliminationAt`. |
| `resetComboStreak` | `(match: Match) => void` | Define `match.comboStreak = 0`. Não afeta `score` nem `lastEliminationAt`. |

**Regras de validação**:
- `applyEliminationScore` é o único ponto que incrementa `score` — nenhuma outra função escreve
  nesse campo (mesma disciplina de "único ponto de mutação" já usada por `markStolen`/`eliminate`).
- `reactionBonusPoints`/`comboBonusPoints` são funções puras sem efeitos colaterais, exercitáveis
  isoladamente com qualquer `number`, sem precisar de uma instância de `Match`.

## Extensão de `MatchSnapshot` (`systems/MatchStateManager.ts`)

| Campo | Tipo | Cálculo | Notas |
|---|---|---|---|
| `score` | `number` | `match.score` (cópia direta) | Ao contrário dos campos de HUD de specs/002, não é derivado — é o valor mutável final, apenas exposto para leitura pelas scenes. |

## Relações

```
Match 1───1 score           [mutável, incrementado só por applyEliminationScore]
Match 1───1 comboStreak     [mutável, incrementado por applyEliminationScore, resetado por resetComboStreak]
Match 1───1 lastEliminationAt [mutável, interno — não exposto via MatchSnapshot]
```

Nenhuma alteração é feita em `FoodItem`, `Shelf`, `Roach`, `RiskLevel` ou nas transições de
`Match.status` já documentadas em specs 001/002 — esta feature é estritamente aditiva.

## Impacto em testes existentes

O helper `matchWithRemaining` em `client/tests/unit/match.hud.test.ts` constrói um objeto `Match`
por literal (`{ shelves, foodItems, activeRoaches, status }`) e precisa passar a incluir
`score: 0, comboStreak: 0, lastEliminationAt: null` para continuar compilando, já que esses campos
passam a ser obrigatórios na interface `Match`. Nenhum teste existente depende do *valor* desses
campos — apenas da forma do objeto.
