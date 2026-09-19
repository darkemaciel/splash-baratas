# Data Model: High Score Local

**Revisão pós-implementação (2026-09-19)**: este documento foi reescrito para o ranking Top 5
(`## Clarifications` do `spec.md`) — a versão anterior descrevia um recorde único
(`HighScoreRecordResult { highScore, isNewHighScore }`), substituída pelo modelo abaixo.

**Segunda revisão pós-implementação (2026-09-19)**: cada entrada do ranking passou de um `number`
solto para `{ name, score }` — o dono do produto pediu para identificar o jogador de cada pontuação
salva, não só o valor.

**Terceira revisão pós-implementação (2026-09-19)**: o dono do produto pediu para concentrar tudo
na tela de derrota, como em jogos de arcade — `StartScene` não chama mais `getRanking()` nem exibe
nada (US2 do `spec.md` foi descontinuada); `GameOverScene` deixou de mostrar a mensagem de derrota e
o tempo de sobrevivência (só a pontuação final fica, centralizada), passou a coletar o nome do
jogador com um painel desenhado no próprio canvas (captura de teclado + cursor piscando, sem
`window.prompt()`, que "parecia algo fora do jogo") e passou a exibir o Top 5 num card centralizado
na tela no estilo "high scores" de fliper/arcade, com as linhas alinhadas à esquerda entre si.
FR-006/FR-007 abaixo (tela inicial) estão desatualizados e serão revisados numa próxima limpeza de
spec.

Esta feature não introduz nenhum campo novo em `Match`, `FoodItem`, `Shelf`, `Roach` ou
`MatchSnapshot` (documentados em `specs/001-roach-fridge-clicker/data-model.md` e estendidos pelas
features seguintes). O "Ranking local" (Key Entities do `spec.md`) não é estado de uma `Match` —
vive inteiramente em `localStorage`, fora do ciclo de vida de qualquer partida.

## Constantes novas (`client/src/config/gameConfig.ts`)

| Constante | Valor | Papel |
|---|---|---|
| `HIGH_SCORE_STORAGE_KEY` | `"baratas-na-geladeira:high-score"` | Chave namespaced usada para ler/escrever o ranking em `localStorage` — evita colisão com outras chaves que uma feature futura possa adicionar ao mesmo domínio |
| `HIGH_SCORE_RANKING_MAX_ENTRIES` | `5` | Tamanho fixo do ranking (Top 5, `spec.md` → Clarifications) |

## Módulo novo (`client/src/systems/HighScoreStore.ts`)

### Tipo

```ts
interface RankingEntry {
  readonly name: string;
  readonly score: number;
}

interface RecordScoreResult {
  readonly ranking: readonly RankingEntry[];
  readonly position: number | null;
}
```

- `ranking`: o ranking vigente **após** a chamada — até `HIGH_SCORE_RANKING_MAX_ENTRIES` entradas
  `{ name, score }`, sempre ordenadas da maior para a menor pontuação.
- `position`: a posição 1-based (1 = melhor) da pontuação informada dentro de `ranking`, ou `null`
  se ela não entrou no ranking (FR-002/FR-004).

### Funções

| Função | Assinatura | Papel |
|---|---|---|
| `getRanking` | `() => readonly RankingEntry[]` | Lê o ranking salvo; array vazio significa "nenhuma partida concluída ainda" (FR-007), nunca confundido com um ranking contendo zeros |
| `recordScore` | `(name: string, score: number) => RecordScoreResult` | Insere `{ name, score }` no ranking salvo se houver espaço livre (menos de 5 entradas) ou se `score` for maior que a menor entrada atual; ao inserir com o ranking já cheio, remove a menor entrada anterior (FR-002/FR-003); não altera nada em caso de empate/valor menor com o ranking cheio (FR-004) |

Ambas puras do ponto de vista do domínio do jogo (sem `import Phaser`, sem depender de `Match`) —
o único efeito colateral é I/O em `localStorage`, sempre protegido por `try/catch` (FR-009).

## Fluxo (pontos de chamada)

```
StartScene.create()
  não chama HighScoreStore — nenhuma referência ao ranking na tela inicial (revisado, ver acima)

GameOverScene.create()
  snapshot = matchStateManager.getSnapshot()                    // já existe (specs/004, specs/007)
  painel de nome desenhado no canvas (teclado, sem window.prompt)  // NOVO
  { position, ranking } = recordScore(name, snapshot.score)     // NOVO, ao confirmar (ENTER)
  └── position != null → exibe a posição alcançada (FR-005, US1 cenários 1-3)
      position == null → nenhum texto extra (US1 cenário 4)
  renderRankingCard(ranking) → card "TOP 5 SCORES" centralizado, linhas alinhadas à esquerda entre si
```

Nenhuma seta acima cruza para `entities/Match.ts` ou `systems/MatchStateManager.ts` — ambos
permanecem exatamente como estão hoje; `snapshot.score` já existe e já é lido por `GameOverScene`
para o texto "Pontuação final".

## Formato salvo em `localStorage` e migração do formato anterior

O valor sob `HIGH_SCORE_STORAGE_KEY` é um array JSON de objetos `{ name, score }`, ex.
`"[{\"name\":\"Ana\",\"score\":320},{\"name\":\"Bruno\",\"score\":210}]"`, sempre ordenado da maior
para a menor pontuação. Duas versões anteriores desta feature usaram formatos diferentes sob a
mesma chave: um único número como string (ex. `"120"`) e, depois, um array de números puros (ex.
`"[320,210,150]"`, sem nome). Ambos falham em `isValidEntry` (o primeiro em `Array.isArray(...)`, o
segundo por seus elementos não serem objetos com `name`/`score`) e são tratados como "ranking
vazio" — a migração é automática e silenciosa, sem necessitar de código dedicado (research.md §6).

## Estado — nenhum novo em `Match`/`MatchSnapshot`

| Pergunta | Resposta |
|---|---|
| Onde vive o ranking entre partidas? | Em `localStorage`, sob `HIGH_SCORE_STORAGE_KEY` — fora de qualquer `Match` |
| Existe um campo `ranking`/`highScore` em `Match`/`MatchSnapshot`? | Não, e não é necessário para nenhum requisito do spec |
| O ranking é resetado por `start()`/`restart()`? | Não — `start()`/`restart()` só afetam a `Match` corrente; o ranking persiste até uma entrada ser deslocada ou até `localStorage` ser limpo (FR-011) |
| O que acontece se `localStorage` estiver indisponível? | `getRanking()` retorna `[]`; `recordScore()` calcula `position` normalmente (comparando contra um ranking vazio), mas a escrita falha silenciosamente — a partida seguinte trata novamente como "ranking vazio" (FR-009) |
| O que acontece se o valor salvo estiver corrompido ou em um formato antigo (número único, ou array de números puros sem nome)? | Tratado como `[]` (ranking vazio) tanto em `getRanking()` quanto em `recordScore()` (FR-010) |
| Como é calculada a posição em caso de pontuações empatadas dentro do ranking? | A posição mais alta entre as posições empatadas (primeira ocorrência do valor no array ordenado) — Edge Case do `spec.md` |
