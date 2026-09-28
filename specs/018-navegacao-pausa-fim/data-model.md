# Data Model: Navegação completa da pausa e do fim de jogo

**Feature**: `specs/018-navegacao-pausa-fim` | **Date**: 2026-09-28

## Partida (`Match`, domínio): ciclo de vida

Sem campos novos. `MatchStatus` continua `"notStarted" | "playing" | "lost"`.

```text
                  start()/restart()                 tick(): última comida roubada
  notStarted ───────────────────────▶ playing ─────────────────────────────────────▶ lost
                                         │                                           ▲
                                         └──────── forfeit(now)  (NOVO) ─────────────┘
  lost ── start()/restart() ──▶ playing        (DE NOVO!, REINICIAR, MENU → JOGAR)
```

| Transição | Efeito | Evento |
|---|---|---|
| `forfeit(now)` com `playing` | `endedAt = now`, `status = "lost"`; comidas, pontos, combo e baratas ficam como estavam | `match:lost` (o mesmo snapshot de uma derrota) |
| `forfeit(now)` com outro status | nenhum; devolve `false` | nenhum |
| `restart(now)` com qualquer status | partida nova (9 comidas, 0 pontos, combo 0, sem baratas, `endedAt = null`) | `match:started` |

Invariantes:
- Depois de `forfeit`, `tick()` não spawna nem rouba (já garantido pela checagem de `status`).
- `elapsedMs(snapshot, qualquerNow)` depois de `forfeit(t)` é `t − startedAt`.
- `forfeit` nunca altera `score`, `comboStreak` nem `foodItems`.

## Estado da `PauseOverlayScene` (apresentação, não persistido)

```text
            REINICIAR                        confirmar (REINICIAR)
  painel ─────────────▶ confirmarReiniciar ───────────────────────▶ [sai: partida nova]
    │ ▲                        │
    │ └──── CONTINUAR (diálogo) ┘
    │ ENCERRAR PARTIDA                 confirmar (ENCERRAR)
    ├─────────────────▶ confirmarEncerrar ────────────────────────▶ [sai: fim de jogo]
    │ ▲                        │
    │ └──── CONTINUAR (diálogo) ┘
    └── CONTINUAR (painel) ou tecla P ──▶ [sai: retoma a partida]
```

- Dado de entrada: `{ pausedAtLogicalMs: number }`, o relógio lógico da partida no instante da
  pausa, que desconta os intervalos pausados.
- `leaving: boolean` começa `false` e, depois da primeira saída, todas as ações são ignoradas.
- A tecla P só age no estado `painel`.

## Estado da `GameOverScene` (acréscimo)

- `leaving: boolean`. DE NOVO! e MENU são mutuamente exclusivos, e só o primeiro acionamento vale.

## Textos novos da interface

| Onde | Texto |
|---|---|
| Pausa (pilha) | CONTINUAR · REINICIAR · ENCERRAR PARTIDA |
| Diálogo de REINICIAR | título "REINICIAR PARTIDA?" · "Você perde esta partida e começa outra do zero." · CONTINUAR · REINICIAR |
| Diálogo de ENCERRAR | título "ENCERRAR PARTIDA?" · "Você vai direto para a tela de fim de jogo." · CONTINUAR · ENCERRAR |
| Fim de jogo | DE NOVO! · MENU |

Rótulos acessíveis (proxies): "Continuar", "Reiniciar", "Encerrar partida", "Encerrar", "De novo!",
"Menu".
