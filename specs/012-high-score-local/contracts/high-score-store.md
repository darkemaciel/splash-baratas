# Contrato: `HighScoreStore`

**Revisão pós-implementação (2026-09-19)**: contrato reescrito para o ranking Top 5
(`spec.md` → Clarifications). A versão anterior descrevia `getHighScore(): number | null` e
`recordScore(score): { highScore, isNewHighScore }` para um recorde único — substituídas abaixo.

**Segunda revisão pós-implementação (2026-09-19)**: `recordScore` passou a receber também o nome do
jogador (`recordScore(name, score)`), e cada entrada do ranking guarda `{ name, score }` em vez de
um `number` solto — pedido do dono do produto para identificar de quem é cada pontuação.

**Terceira revisão pós-implementação (2026-09-19)**: `StartScene` deixou de chamar `getRanking()` —
o dono do produto pediu para concentrar tudo na tela de derrota, como em jogos de arcade (a seção
"Chamadores" sobre `StartScene` abaixo está obsoleta). Em `GameOverScene.create()`, o nome do
jogador deixou de ser coletado via `window.prompt()` ("parecia algo fora do jogo") e passou a ser
digitado num painel desenhado no próprio canvas (captura de teclado, cursor piscando, confirmação
por ENTER); o retorno de `recordScore` (`ranking`) agora também alimenta um card "TOP 5 SCORES"
renderizado na própria tela de derrota, no estilo de telas de high score de fliper/arcade.

Este projeto não expõe API externa — o "contrato" aqui é a interface interna entre
`systems/HighScoreStore.ts` (dados + funções, sem `import Phaser`) e suas duas chamadoras,
`scenes/StartScene.ts` e `scenes/GameOverScene.ts`.

## `getRanking(): readonly RankingEntry[]` (`RankingEntry = { name: string; score: number }`)

- **Entrada**: nenhuma.
- **Saída**: até `HIGH_SCORE_RANKING_MAX_ENTRIES` (5) entradas `{ name, score }`, ordenadas da maior
  para a menor pontuação; array vazio (`[]`) se nenhuma partida foi concluída ainda neste
  navegador, se `localStorage` estiver indisponível, ou se o valor salvo estiver corrompido/em
  formato inesperado — incluindo os formatos de versões anteriores desta feature (número único, ou
  array de números puros sem nome) (FR-007, FR-009, FR-010).
- **Garantias**:
  - Nunca lança exceção, independentemente do estado de `localStorage`.
  - Não tem efeito colateral — não escreve nada, mesmo ao encontrar um valor corrompido (apenas o
    ignora, retornando `[]`).
  - O array retornado está sempre ordenado da maior para a menor pontuação.
  - `[]` é o único valor usado para "nenhuma partida registrada" — nunca confundido com um ranking
    contendo entradas de valor `0`.

## `recordScore(name: string, score: number): { ranking: readonly RankingEntry[]; position: number | null }`

- **Entrada**:
  - `name`, o nome digitado pelo jogador via `window.prompt()` em `GameOverScene.create()` (string
    não vazia após `trim()`; a scene usa `"Jogador"` como padrão se o prompt for cancelado ou
    deixado em branco — `recordScore` em si não valida nem normaliza `name`, apenas o armazena).
  - `score`, a pontuação final de uma partida que acabou de terminar (na prática, sempre
    `MatchSnapshot.score` lido em `GameOverScene.create()`, já congelado no momento da derrota).
- **Saída**: um objeto com:
  - `ranking`: o ranking vigente após a chamada (até 5 entradas, ordenado da maior para a menor).
  - `position`: a posição 1-based de `score` dentro de `ranking`, ou `null` se `score` não entrou.
    Em caso de pontuações empatadas dentro do ranking, `position` reflete a posição mais alta entre
    as posições empatadas.
- **Garantias**:
  - **Determinístico frente ao estado salvo**: dado o mesmo ranking salvo, a mesma `score` sempre
    produz o mesmo resultado.
  - Se o ranking salvo tem menos de `HIGH_SCORE_RANKING_MAX_ENTRIES` entradas: `score` sempre entra,
    independentemente do seu valor (incluindo `0`) (FR-002, US1 cenários 1-2).
  - Se o ranking salvo já tem `HIGH_SCORE_RANKING_MAX_ENTRIES` entradas e `score` é estritamente
    maior que a menor delas: `score` entra, a menor entrada anterior é removida, e o ranking
    retornado continua com exatamente `HIGH_SCORE_RANKING_MAX_ENTRIES` entradas (FR-002, FR-003,
    US1 cenário 3).
  - Se o ranking salvo já tem `HIGH_SCORE_RANKING_MAX_ENTRIES` entradas e `score` é igual ou menor
    que a menor delas: não escreve nada em `localStorage`; retorna `position: null` e `ranking`
    idêntico ao salvo anteriormente (FR-004, US1 cenário 4).
  - Ao inserir, tenta persistir o novo `ranking` em `localStorage` **mesmo que a escrita falhe**
    (FR-002, FR-009) — o retorno reflete o resultado desta partida independentemente de a
    persistência ter tido sucesso.
  - Nunca lança exceção, independentemente do estado de `localStorage`.
  - Não faz nenhuma suposição sobre `Match`/`MatchSnapshot` — recebe um `number` puro, não um
    objeto de domínio.

## Chamadores

- **`StartScene.create()`** NÃO DEVE importar `systems/HighScoreStore.ts` nem chamar `getRanking()`
  ou `recordScore()` (revisado — versões anteriores exibiam o ranking aqui; US2 do `spec.md` foi
  descontinuada a pedido do dono do produto). A tela inicial não tem mais nenhuma referência ao
  ranking.

- **`GameOverScene.create()`** DEVE coletar o nome do jogador através de um painel próprio (teclado
  capturado via `this.input.keyboard`, sem `window.prompt()`) e chamar
  `recordScore(name, snapshot.score)` **exatamente uma vez** por partida perdida, ao confirmar o
  nome (garantido hoje porque `GameScene` só inicia `GameOverScene` uma vez por evento
  `match:lost`), usando o `position` retornado para decidir se exibe a posição alcançada (FR-005) e
  o `ranking` retornado para preencher o card "TOP 5 SCORES" exibido na mesma tela. NÃO DEVE chamar
  `recordScore` mais de uma vez para a mesma partida, nem chamá-lo antes de a partida ter
  efetivamente terminado.

- Nenhum outro arquivo (`MatchStateManager`, `entities/`, `GameScene`, `PauseOverlayScene`,
  `StartScene`) DEVE importar `systems/HighScoreStore.ts` — o ranking é uma preocupação exclusiva de
  `GameOverScene`.
