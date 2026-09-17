# Contract: Efeito de Juice na Barata (Squash/Stretch + Tremor)

Esta feature não altera o contrato de domínio↔renderização existente
(`specs/001-roach-fridge-clicker/contracts/domain-api.md` e extensões seguintes) — nenhum evento
novo é adicionado ao `MatchStateManager`, nenhum campo novo é adicionado a `Roach`/`MatchSnapshot`.
Este documento registra o contrato **novo** desta feature: a fórmula de intensidade do efeito
visual e a garantia de que ele nunca interfere no hit-testing, para que features futuras que
queiram ajustar ou estender o "juice" (ex.: tipos de barata com efeitos diferentes, item de
backlog "Tipos de barata") sigam o mesmo padrão em vez de criar um paralelo.

## Entrada única: `progress`

Todo o efeito é uma função de `progress(roach, now)` — já exportado por `entities/Roach.ts`,
inalterado por esta feature — e do timestamp corrente (`this.time.now`, `GameScene`). Nenhuma outra
leitura de estado de domínio é necessária.

| `progress` | Squash/stretch | Tremor |
|---|---|---|
| `0` (spawn) | Nenhuma deformação (`scale = 1`) | Nenhum deslocamento (`dx = dy = 0`) |
| `0.5` (meio do trajeto) | Deformação parcial, visivelmente perceptível | Deslocamento parcial, frequência intermediária |
| `1` (alcançando o alvo) | Deformação no máximo (`±18%` de escala) | Deslocamento no máximo (`±4px`), frequência máxima |

## Onde o cálculo acontece

`client/src/scenes/GameScene.ts`, dentro de `syncRoachSprites()` — dois métodos privados novos,
chamados para cada barata em `snapshot.activeRoaches`, logo após `positionAt(...)` já ser calculado:

```ts
private computeRoachSquashStretch(roach: Roach, now: number): { scaleX: number; scaleY: number } { /* ver research.md §3 */ }
private computeRoachTremorOffset(roach: Roach, now: number): { dx: number; dy: number } { /* ver research.md §4 */ }
```

Nenhum outro método deve duplicar este cálculo — qualquer novo lugar que precise saber "o quão
intensa está a urgência visual desta barata agora" deve reutilizar estes dois métodos (ou extraí-los
para um ponto compartilhado, se um segundo consumidor aparecer no futuro), nunca reimplementar a
fórmula.

## Garantia de não-interferência no hit-testing (FR-004, Princípio V)

| Caminho de código | Usa `positionAt()` puro? | Usa squash/stretch/tremor? |
|---|---|---|
| `GameScene.syncRoachSprites()` → `sprite.setPosition/setScale` | Sim (como base) | Sim (somado por cima, só para desenho) |
| `GameScene.handlePointerDown()` → `CollisionSystem.pickTopmostHit` | Sim (direto) | **Não** |

Qualquer alteração futura a `handlePointerDown` ou a `CollisionSystem` que passe a ler
`sprite.x`/`sprite.y`/`sprite.scaleX`/`sprite.scaleY` em vez de recalcular via `positionAt()`
quebraria esta garantia e deve ser rejeitada em revisão — o hit-test **deve** continuar cego ao
efeito visual, por definição desta feature.

## Constantes do efeito (`GameScene.ts`)

| Constante | Valor | Efeito |
|---|---|---|
| `SQUASH_STRETCH_MAX_DELTA` | `0.18` | Deformação máxima de escala (±18%) em `progress = 1` |
| `SQUASH_STRETCH_FREQUENCY_HZ` | `4` | Frequência fixa da oscilação de squash/stretch |
| `TREMOR_MAX_OFFSET_PX` | `4` | Deslocamento máximo (px) em `progress = 1`, menor que `HITBOX_PADDING_PX` (6px) |
| `TREMOR_BASE_FREQUENCY_HZ` | `6` | Frequência do tremor em `progress = 0` |
| `TREMOR_MAX_FREQUENCY_HZ` | `14` | Frequência do tremor em `progress = 1` |

Ajustes de tuning (valores acima) podem mudar em iterações futuras sem quebrar este contrato,
desde que `TREMOR_MAX_OFFSET_PX` permaneça `< HITBOX_PADDING_PX` e a fórmula continue zerada em
`progress = 0`.

## Extensão futura (fora de escopo desta feature)

- **Tipos de barata com efeitos diferentes** (backlog, seção 2): poderia parametrizar
  `computeRoachSquashStretch`/`computeRoachTremorOffset` por um "perfil de juice" adicional, sem
  mudar a garantia de não-interferência no hit-testing acima.
- **Modo de acessibilidade contra excesso de movimento** (fora de escopo, ver Clarifications do
  `spec.md`): se priorizado no futuro, deve envolver um fator multiplicador aplicado sobre
  `SQUASH_STRETCH_MAX_DELTA`/`TREMOR_MAX_OFFSET_PX` (ex.: `0` para desativar), sem alterar onde ou
  como o efeito é calculado.
