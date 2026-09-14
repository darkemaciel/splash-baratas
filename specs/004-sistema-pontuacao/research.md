# Research: Sistema de Pontuação

Resolve as decisões técnicas necessárias para implementar a pontuação descrita em `spec.md`,
incluindo os valores concretos dos parâmetros de balanceamento que a spec deliberadamente deixou
para a fase de planejamento (seção Assumptions). Nenhum NEEDS CLARIFICATION restante.

## 1. Onde armazenar a pontuação e o combo

**Decision**: adicionar três campos ao `Match` (`entities/Match.ts`): `score: number`,
`comboStreak: number` e `lastEliminationAt: number | null`, inicializados em `0`, `0` e `null`
tanto em `createMatch()` quanto em `createEmptyMatch()`.

**Rationale**: pontuação e combo são estado central da partida — precisam ser exibidos, persistir
até o fim de jogo (FR-010) e resetar exatamente quando o resto do `Match` reseta (FR-011). Isso os
torna equivalentes a `status`, não a um valor derivado como `riskLevel` (specs/002). Seguir o mesmo
padrão de campo mutável do `Match` mantém a fronteira single-source-of-truth já estabelecida.

**Alternatives considered**: guardar `comboStreak`/`lastEliminationAt` como estado privado do
`MatchStateManager` (como já ocorre com `lastSpawnAt`, que é puramente uma questão de cadência de
spawn, não de regra de jogo visível). Rejeitado para `comboStreak`/`lastEliminationAt` porque são
regras de jogo (afetam o valor de pontos ganhos, testável isoladamente) e não apenas agendamento
interno — pertencem à camada de domínio pura, testável sem depender da classe orquestradora.

## 2. Fórmula do bônus de velocidade de reação

**Decision**: faixas fixas (tiers), não uma curva contínua:

| Tempo desde o spawn até o clique (`reactionMs`) | Bônus |
|---|---|
| `<= 500ms` | `+50` |
| `<= 1000ms` | `+25` |
| `<= 1500ms` | `+10` |
| `> 1500ms` | `+0` |

Implementado como `reactionBonusPoints(reactionMs: number): number` em `entities/Match.ts`, usando
constantes nomeadas em `gameConfig.ts` (`REACTION_BONUS_TIERS`). Os limiares são avaliados com
`<=` em ordem crescente, então o limite exato de cada faixa ainda recebe o bônus daquela faixa
(resolve o Edge Case da spec: "no limite exato, o bônus ainda se aplica").

**Rationale**: `TRAVEL_DURATION_MS = 3000` (gameConfig.ts) é o tempo total de viagem da barata; as
faixas escolhidas (500/1000/1500ms) cobrem a primeira metade desse tempo, recompensando reação
rápida sem exigir cliques quase instantâneos para qualquer bônus. Faixas fixas são mais simples de
implementar, testar (limites discretos) e comunicar ao jogador do que uma curva de decaimento
contínua — alinhado ao Princípio IV (simplicidade deliberada), que já rejeita "sistemas de
balanceamento genéricos" para o MVP.

**Alternatives considered**: decaimento linear contínuo (`bonus = MAX * (1 - reactionMs / WINDOW)`)
— rejeitado por ser mais difícil de testar com precisão (valores fracionários/arredondamento) e por
tornar o Edge Case do limite exato ambíguo (o valor tende a exatamente `0` na borda, contradizendo
"o bônus ainda se aplica"); tiers fixos evitam essa ambiguidade por construção.

## 3. Fórmula do bônus de combo

**Decision**: `comboBonusPoints(comboStreakAfterIncrement: number): number = COMBO_BONUS_STEP_POINTS * max(0, comboStreakAfterIncrement - 1)`,
com `COMBO_BONUS_STEP_POINTS = 25`. A primeira eliminação de uma sequência (`comboStreak === 1`) não
recebe bônus de combo (`0`); a segunda eliminação consecutiva bem-sucedida (`comboStreak === 2`)
recebe `+25`; a terceira (`comboStreak === 3`) recebe `+50`; e assim por diante, sem teto.

**Rationale**: cresce de forma previsível e perceptível (SC-003 da spec: "sequências de 3+
eliminações rendem pontuação visivelmente maior"), sem exigir uma tabela de multiplicadores
separada. Não há teto porque o combo já é naturalmente limitado pela cadência de spawn
(`SPAWN_INTERVAL_MS = 2500ms`) e pela janela de combo (decisão #4) — sequências muito longas exigem
desempenho consistentemente alto do jogador, o que já é a recompensa pretendida.

**Alternatives considered**: multiplicador percentual sobre a pontuação base (ex.: `+10% por
combo`) — rejeitado por acoplar o bônus de combo ao valor de pontuação base de forma que qualquer
rebalanceamento futuro de um afeta o outro implicitamente; um incremento fixo por nível de combo é
mais simples de ajustar isoladamente.

## 4. Janela de tempo para manter o combo vivo

**Decision**: `COMBO_WINDOW_MS = 3000` (revisado de 2000ms durante a implementação — ver Nota de
implementação abaixo). Ao processar uma eliminação, se `lastEliminationAt !== null` e
`now - lastEliminationAt > COMBO_WINDOW_MS`, o combo é resetado para `0` antes de contar a
eliminação atual (que passa a iniciar uma nova sequência, com `comboStreak = 1`).

**Rationale**: com `SPAWN_INTERVAL_MS = 2500` e `TRAVEL_DURATION_MS = 3000` (gameConfig.ts), no
máximo duas baratas ficam simultaneamente ativas antes que a mais antiga expire (rouba a comida) —
uma terceira barata só nasce em `2 * SPAWN_INTERVAL_MS = 5000ms` após a primeira, quando a primeira
já expirou em `TRAVEL_DURATION_MS = 3000ms`. Isso força um intervalo mínimo de
`2 * SPAWN_INTERVAL_MS - TRAVEL_DURATION_MS = 2000ms` entre a eliminação mais tardia de uma leva e
a eliminação mais cedo possível da leva seguinte, mesmo para o jogador mais rápido. Uma janela de
exatamente 2000ms tornaria um combo de 3+ alcançável apenas com precisão de milissegundo (sem
nenhuma folga de reação humana); 3000ms dá ~1000ms de folga real, mantendo a mecânica desafiadora
mas jogável.

**Nota de implementação**: o valor original (2000ms) foi escolhido no planejamento sem checar essa
interação com `SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS`; o problema só ficou evidente ao escrever os
testes de orquestração de combo (T027) tentando encadear 3 eliminações — nenhuma combinação de
timestamps realista passava. Corrigido para 3000ms antes de finalizar a User Story 3.

**Alternatives considered**: usar `SPAWN_INTERVAL_MS` diretamente como janela de combo — rejeitado
por acoplar duas constantes conceitualmente distintas (cadência de spawn vs. janela de reação do
jogador); mudar uma no futuro (backlog: "dificuldade progressiva") não deveria alterar
silenciosamente a outra.

## 5. Gatilhos de reset do combo

**Decision**: três gatilhos, todos chamando a mesma função pura `resetComboStreak(match)`:
1. Roubo de comida (`MatchStateManager.tick()`, branch `food:stolen` já existente) — reseta
   incondicionalmente, mesmo que a barata que roubou não tivesse relação com a sequência de combo
   atual (spec, Acceptance Scenario 2 da User Story 3).
2. Clique sem acertar nenhuma barata — novo método público `MatchStateManager.registerMissedClick()`,
   chamado por `GameScene.handlePointerDown()` no branch onde `pickTopmostHit` retorna `undefined`
   (mesmo branch que hoje só toca `sfx-miss`).
3. Estouro da janela de tempo entre eliminações consecutivas — tratado dentro de
   `applyEliminationScore()` (decisão #4), não é um gatilho externo separado.

**Rationale**: reaproveita exatamente a distinção acerto/erro que o `CollisionSystem` já produz
para o som de erro (`sfx-miss`) — nenhuma nova regra de hit-testing é criada, consistente com a
Assumption da spec de que "clique sem acertar nenhuma barata" usa a mesma detecção já existente.

**Alternatives considered**: tratar um clique sem acertar nenhuma barata via um novo evento (`click:missed`) emitido pelo
`MatchStateManager` — rejeitado como indireção desnecessária; como `GameScene` já sabe, no momento
do clique, se houve acerto geométrico ou não, chamar um método direto (`registerMissedClick()`) é
mais simples do que orquestrar mais um evento pub-sub para um reset de estado que não precisa ser
observado por múltiplos assinantes.

## 6. Exposição da pontuação para a camada de renderização

**Decision**: adicionar `score: number` a `MatchSnapshot` (`MatchStateManager.getSnapshot()`),
copiado diretamente de `match.score` (sem cálculo — ao contrário de `riskLevel`, que é derivado,
`score` já é o valor final mutável).

**Rationale**: mantém `MatchSnapshot` como único canal de leitura entre domínio e `scenes/`
(mesmo contrato estendido por specs/001 e specs/002), evitando um segundo canal de leitura.

**Alternatives considered**: nenhuma — é a extensão mais direta do padrão já estabelecido.

## 7. Renderização no HUD e na tela de fim de jogo

**Decision**: em `GameScene`, criar um segundo `Phaser.GameObjects.Text` (`scoreText`) posicionado
logo abaixo da barra de risco existente (`HUD_BAR_Y + HUD_BAR_HEIGHT + margem`), atualizado no
mesmo assinante de evento que hoje só toca o som de acerto (`roach:eliminated`), lendo
`matchStateManager.getSnapshot().score` a cada atualização — sem novo tipo de evento (decisão #6).
Em `GameOverScene`, ler `matchStateManager.getSnapshot().score` em `create()` e exibir como texto
estático abaixo da mensagem de derrota já existente.

**Rationale**: reaproveita exatamente o padrão "atualizar por evento, não por frame" já validado em
specs/002 (Princípio V) e a mesma primitiva visual (`Text`), sem novo asset. Posicionar abaixo da
barra de risco satisfaz o requisito da spec de ficar "junto ao contador de progresso/risco já
existente" sem sobrepor prateleiras (que começam em `y = 120`, `gameConfig.ts`).

**Alternatives considered**: combinar pontuação e contador de comidas no mesmo `Text` (ex.:
"7/9 • 350 pts") — rejeitado por acoplar duas informações conceitualmente distintas no mesmo nó
visual, dificultando estilizar/testar cada uma isoladamente no futuro (ex.: destacar a pontuação
com animação de "+pontos" é um item plausível de backlog futuro).

## 8. Testes

**Decision**: `bun test` cobrindo:
- Funções puras (`client/tests/unit/match.score.test.ts`): `reactionBonusPoints` nos quatro
  limiares (incluindo os limites exatos 500/1000/1500ms), `comboBonusPoints` para
  `comboStreak` = 1, 2, 3, 5, `applyEliminationScore` (soma base + bônus, incremento de
  `comboStreak`, reset por timeout) e `resetComboStreak`.
- Orquestração (`client/tests/unit/matchStateManager.score.test.ts`): pontuação soma ao eliminar
  uma barata via `tryEliminateRoach`; pontuação não muda ao roubar comida nem ao chamar
  `registerMissedClick()`; combo reseta em roubo/clique sem acertar/timeout; pontuação final
  preservada após `match:lost`; pontuação e combo voltam a `0` após `restart()`; a soma dos pontos
  de eliminações individuais bate exatamente com o total final (`score`), sem perda nem
  duplicação (SC-004).
- Atualização do helper existente `matchWithRemaining` em `match.hud.test.ts` para incluir os
  novos campos obrigatórios do `Match` (`score: 0, comboStreak: 0, lastEliminationAt: null`), já
  que a interface `Match` passa a exigi-los.
- Renderização (HUD/tela de fim de jogo) validada manualmente via `bun run dev`, mesmo padrão de
  specs 002/003 (sem framework de teste visual no projeto).

**Rationale**: consistente com o test runner e a granularidade já fixados pelo MVP e por specs
002/003 — funções puras isoladas + orquestração via `MatchStateManager`, sem introduzir nova
infraestrutura de teste.

**Alternatives considered**: nenhuma — segue o padrão já estabelecido no repositório.
