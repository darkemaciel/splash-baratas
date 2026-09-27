# Data Model: Cursor Animado da Pata do Gato

## Estado de apresentação: Animação da Pata

Estado transiente, mantido em memória apenas por `CursorScene` (não persistido, não compartilhado
entre sessões nem entre Scenes) — descreve qual animação o sprite da pata está tocando a cada
instante.

| Campo | Tipo | Descrição |
|---|---|---|
| `position` | `{ x: number, y: number }` | Última posição conhecida do ponteiro (de `pointermove`), atualizada a cada frame em `update()`. |
| `animationState` | `"idle" \| "strike"` | Qual animação está tocando agora. `"idle"` não é mais um balanço automático (revisado em 2026-09-26) — é a pata reagindo à direção do movimento do ponteiro (ou parada, se ele não estiver se movendo). |
| `strikeStartedAt` | `number \| null` | Timestamp (`this.time.now`) de início do golpe atual, usado para saber quando ele termina e a pata volta a `"idle"`. |
| `lastFramePosition` | `{ x: number, y: number }` | Posição do ponteiro no frame anterior — usada só durante `"idle"` para calcular a direção do movimento (`pointerX/Y - lastFramePosition`) e o ângulo de inclinação (FR-003). |

**Regras**:
- Existe exatamente uma instância desse estado, global à janela do jogo — não há um estado por
  Scene nem por partida (a pata é a mesma em menus e durante o jogo, FR-001).
- `animationState` começa em `"idle"` assim que `CursorScene` é criada (no boot do jogo).
- Nenhuma persistência: ao recarregar a página, o estado reinicia em `"idle"` — não há necessidade
  de lembrar nada entre sessões (diferente de `AudioPreferenceStore`/`HighScoreStore`).

**Transições de estado**:

```
"idle" --(this.game.events emite "cursor:strike")--> "strike"
"strike" --(duração da animação de golpe termina)--> "idle"
"strike" --(this.game.events emite "cursor:strike" de novo, golpe ainda em andamento)--> "strike"
                                                       (reinicia strikeStartedAt — FR-006)
```

Não há outras transições: o estado só muda em reação ao evento de golpe (emitido por
`GameScene.handlePointerDown`, ver `research.md` §3) ou à conclusão natural da animação de golpe.

## Sem novas entidades de domínio

Esta feature não introduz nem altera entidades do domínio de partida (`Match`, `Roach`, `FoodItem`,
`Shelf`) nem estado gerenciado pelo `MatchStateManager` — o estado da pata é puramente de
apresentação, vivendo inteiramente dentro de `CursorScene` (Constitution Princípio I).
