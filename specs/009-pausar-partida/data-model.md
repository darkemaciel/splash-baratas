# Data Model: Pausar Partida

Esta feature não introduz nem altera nenhuma entidade de domínio. `Match`, `FoodItem`, `Roach`,
`Shelf` e `MatchSnapshot` (documentados em `specs/001-roach-fridge-clicker/data-model.md` e
estendidos pelas features seguintes) permanecem exatamente como estão — nenhum campo novo é
adicionado a `Match`/`Roach`/`MatchSnapshot`, e `MatchStateManager` não recebe nenhum método ou
evento novo.

## Estado de Pausa (derivado, sem campo próprio)

Ao contrário de `specs/007-tempo-de-sobrevivencia` (que adicionou `startedAt`/`endedAt` a `Match`)
ou `specs/004-sistema-pontuacao` (que adicionou `score`/`comboStreak`), esta feature não introduz
nenhum campo novo em nenhuma estrutura de dados do projeto. O "estado de pausa" descrito no
`spec.md` (Key Entities) é inteiramente representado pelo estado interno já existente do Scene
Manager do Phaser — se `GameScene` está `RUNNING` ou `PAUSED` — consultável via
`this.scene.isPaused("GameScene")` quando necessário, sem que `Match` ou `MatchSnapshot` saibam que
esse conceito existe.

| Pergunta | Resposta |
|---|---|
| Onde vive o estado de pausa? | No próprio Scene Manager do Phaser (`GameScene` ativa vs. pausada) |
| `Match`/`MatchSnapshot` sabem que a partida está pausada? | Não — nenhum campo novo, nenhuma leitura nova |
| `MatchStateManager.tick()` recebe algum parâmetro novo? | Não — continua recebendo só `now`, sem saber que esse `now` já foi corrigido para descontar o tempo pausado |
| O que acontece com `roach.spawnedAt`/`match.startedAt` durante a pausa? | Nada — permanecem exatamente como estavam |
| `this.time.now` (Clock do Phaser) congela sozinho durante a pausa? | Só parcialmente — para de avançar *durante* a pausa, mas **salta** para o tempo real ao retomar (Phaser não desconta o intervalo pausado). Ver research.md §1a |
| Quem corrige esse salto? | `GameScene.pausedAccumMs` (número, ms) + `logicalNow()` — presentation-only, nunca exposto ao domínio |

## Relações

```
Scene Manager do Phaser (estado nativo: GameScene RUNNING | PAUSED)
        │
        ├── RUNNING  → GameScene.update() roda normalmente
        │                 ├── matchStateManager.tick(this.logicalNow())   (spawn/trajeto/roubo)
        │                 ├── syncRoachSprites(...)                        (posição + juice, specs/008)
        │                 └── this.tweens avançam normalmente
        │
        ├── evento PAUSE (Scene)  → pauseStartedAtWallClock = performance.now()
        │
        ├── PAUSED   → GameScene.update() NÃO roda (nativo do Phaser)
        │                 ├── this.time.now para de avançar (mas ainda NÃO está corrigido — ver
        │                 │   research.md §1a; só passa a importar de novo quando a Scene retomar)
        │                 ├── this.tweens para (feedback de eliminação/roubo)
        │                 ├── Input Plugin da Scene desativado (handlePointerDown não dispara)
        │                 └── PauseOverlayScene (Scene separada, launched em paralelo) permanece
        │                     ativa e clicável — exibe "Pausado" + botão "Continuar"
        │
        └── evento RESUME (Scene) → pausedAccumMs += performance.now() - pauseStartedAtWallClock
                                     (a partir daqui, logicalNow() já desconta o salto)
```

Nenhuma seta acima cruza de volta para o domínio (`entities/`/`systems/`) — o fluxo é inteiramente
uma decisão do Scene Manager do Phaser, uma camada de apresentação (Princípios I e II).

## PauseOverlayScene (nova Scene — não é uma entidade de domínio)

Uma `Phaser.Scene` pequena, análoga em porte a `StartScene`/`GameOverScene`, sem estado próprio
além dos Game Objects que desenha:

| Elemento | Papel |
|---|---|
| Retângulo semitransparente (`this.add.rectangle(...)`) | Escurece o jogo congelado atrás, mesmo padrão de `GameOverScene` |
| Texto "Pausado" | Indicação visual clara exigida por FR-012 |
| Botão "Continuar" (`setInteractive` + `pointerdown`) | Único gatilho de retomar exigido por FR-002 — chama `this.scene.stop()` + `this.scene.resume("GameScene")` |

Não lê nem escreve `MatchSnapshot`/`Match` — não precisa de nenhum dado de domínio para existir.
