# Contract: API interna Domínio ↔ Renderização — HUD de Progresso/Risco

Extensão do contrato existente em `specs/001-roach-fridge-clicker/contracts/domain-api.md`. A
regra continua a mesma: `GameScene` só pode ler estes valores através de `MatchSnapshot`, nunca
recalculando os limiares de risco por conta própria (Princípios I e II da constitution).

## Novas funções puras — `entities/Match.ts`

| Função | Assinatura | Efeito |
|---|---|---|
| `foodRemainingCount(match)` | `(Match): number` | Retorna a quantidade de `FoodItem`s com `state === 'present'`. |
| `foodTotalCount(match)` | `(Match): number` | Retorna o total de `FoodItem`s da partida corrente (`match.foodItems.length`). |
| `riskLevel(match)` | `(Match): RiskLevel` | Retorna `'safe' \| 'elevated' \| 'critical'` a partir de `foodRemainingCount`/`foodTotalCount`, conforme os limiares de FR-005 (ver `data-model.md`). |

Nenhuma dessas funções aceita ou retorna tipos do Phaser; todas são testáveis isoladamente via
`bun test`, sem depender de `MatchStateManager` nem de qualquer `Scene`.

## Extensão de `MatchSnapshot` — `systems/MatchStateManager.ts`

```ts
export interface MatchSnapshot {
  // ...campos existentes (shelves, foodItems, activeRoaches, status)
  readonly foodRemainingCount: number;
  readonly foodTotalCount: number;
  readonly riskLevel: RiskLevel;
}
```

`getSnapshot()` passa a calcular esses três campos a partir do `Match` interno, chamando as novas
funções puras. Nenhum evento novo é necessário — os consumidores já reagem a `food:stolen` e
`match:started`/`match:lost`, que continuam sendo os únicos gatilhos que alteram esses valores.

## Uso esperado pela camada de renderização

- `GameScene.create()` cria os game objects do HUD (`Phaser.GameObjects.Text` +
  `Phaser.GameObjects.Graphics`) uma única vez, lendo o snapshot inicial (pós `match:started`) para
  o estado inicial.
- `GameScene` atualiza o HUD em resposta aos eventos já assinados (`food:stolen`) e ao evento
  `match:started` (usado hoje por `StartScene`/`GameOverScene` para trocar de tela) — ao receber
  qualquer um desses eventos, relê `matchStateManager.getSnapshot()` e atualiza
  `foodRemainingCount`/`riskLevel` exibidos, redesenhando a `Graphics` apenas se `riskLevel` mudou
  desde a última atualização.
- O HUD NÃO é exibido em `StartScene` nem em `GameOverScene` (FR-008) — essas scenes continuam sem
  nenhuma referência aos novos campos de `MatchSnapshot`.
