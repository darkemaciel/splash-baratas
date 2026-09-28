# Data Model: Pontuação flutuante "+N!"

**Feature**: `specs/019-pontuacao-flutuante` | **Date**: 2026-09-28

## Evento de domínio `roach:eliminated` (alterado)

| Campo | Tipo | Antes | Depois |
|---|---|---|---|
| `roachId` | `string` | ✓ | ✓ (sem mudança) |
| `points` | `number` | — | **novo**: pontos somados à partida por esta eliminação (`applyEliminationScore`) |

Invariantes:
- `points > 0` sempre que o evento é emitido (base 100 + bônus ≥ 0).
- A soma de `points` de todos os eventos de uma partida é igual a `snapshot.score`.
- O evento só é emitido quando `tryEliminateRoach` devolve `true` (clique perdido e barata que já
  roubou não emitem nada, FR-014).

Nenhum estado novo em `Match`.

## Pontuação flutuante (apresentação, efêmera)

| Atributo | Valor |
|---|---|
| texto | `+${formatThousands(points)}!` |
| nascimento | ponto do clique `(px, py)` → acima da pata (research §2), ajustado para caber (research §3) |
| visual | display 40, branco, contorno 3px, sombra 5px, +8° |
| profundidade | `FLOATING_SCORE_DEPTH = 30` |
| vida | 720ms; normal: sobe 48px + some com ease-out; movimento reduzido: parado, some no fim |

```text
  criado ──(720ms, pausável com a GameScene)──▶ destruído
     └──── shutdown da GameScene (reiniciar/encerrar/perder) ────▶ destruído
```
