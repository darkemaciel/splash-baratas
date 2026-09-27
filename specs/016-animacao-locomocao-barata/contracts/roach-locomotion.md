# Contract: Animação de Locomoção da Barata (Andar/Voar)

Esta feature não altera o contrato de domínio↔renderização existente
(`specs/001-roach-fridge-clicker/contracts/domain-api.md` e extensões seguintes) — nenhum evento
novo é adicionado ao `MatchStateManager`, nenhum campo novo é adicionado a `Roach`/`MatchSnapshot`.
Este documento registra o contrato **novo** desta feature, complementando (sem substituir) o já
registrado em `specs/008-juice-animacao-barata/contracts/roach-juice-effect.md`.

## Estilo de locomoção: sorteio e estabilidade

- **Onde vive**: `GameScene.ts`, um `Map<string, "andando" | "voando">` privado (ex.:
  `roachLocomotionStyles`).
- **Quando é atribuído**: uma única vez por barata, no momento em que `syncRoachSprites()` cria o
  sprite dela pela primeira vez (branch `if (!sprite) { ... }`) — nunca re-sorteado depois, mesmo se
  a barata continuar em `snapshot.activeRoaches` por muitos frames.
- **Quando é removido**: no mesmo loop que já destrói o sprite de uma barata que saiu de
  `snapshot.activeRoaches` (eliminada, roubou a comida, ou fim de partida) — sem vazamento de
  entradas no `Map`.
- **Garantia de estabilidade**: para um mesmo `roach.id`, o valor lido do `Map` é sempre o mesmo do
  primeiro frame ao último (FR-003) — qualquer código que precise saber o estilo de uma barata em
  qualquer ponto do trajeto DEVE ler do `Map`, nunca re-sortear.

## Entrada única do cálculo de ângulo: `progress` + `estilo`

```ts
private computeRoachLocomotionAngle(roach: Roach, now: number, estilo: "andando" | "voando"): number { /* ver research.md §4 */ }
```

Chamado para cada barata em `snapshot.activeRoaches`, dentro de `syncRoachSprites()`, junto aos já
existentes `computeRoachSquashStretch`/`computeRoachTremorOffset`. Ao contrário desses dois (cuja
amplitude cresce com `progress(roach, now)`, partindo de zero no spawn), a amplitude da locomoção é
**constante** — não é função de `progress` — para satisfazer FR-001 (animação já em execução desde o
primeiro frame visível).

| Estilo | Frequência | Amplitude | Efeito pretendido |
|---|---|---|---|
| `"voando"` | Alta | Pequena | Inclinação rápida e sutil, associada a bater de asas |
| `"andando"` | Baixa | Maior que a de voo | Balanço mais lento e perceptível, associado a passadas |

Os valores exatos (Hz, graus) são constantes de tuning em `GameScene.ts`, ajustáveis livremente
desde que a diferença entre os dois estilos permaneça visualmente identificável (SC-002) — não fazem
parte deste contrato.

## Animação por quadros e orientação (revisão 2026-09-27)

- `BootScene` carrega os spritesheets `roach-walk`/`roach-fly` (quadros de `ROACH_FRAME_SIZE_PX`
  = 128) e cria as animações em loop com as mesmas chaves (`ROACH_WALK_ANIM`, `ROACH_FLY_ANIM`,
  exportadas de `BootScene.ts`).
- `GameScene` cria cada barata como `Phaser.GameObjects.Sprite` tocando a animação do estilo
  sorteado (`"andando"` → `roach-walk`, `"voando"` → `roach-fly`), a partir de um quadro aleatório.
- Escala final = `ROACH_SPRITE_SCALE` (0.5) × squash/stretch.
- Ângulo final = orientação pelo trajeto (`applyRoachHeading`: `atan2` de `spawnPoint` → alvo,
  descontando `ROACH_SPRITE_FORWARD_DEG`, com `flipX` quando o rumo aponta para a esquerda) **+**
  `computeRoachLocomotionAngle()`.
- A garantia de não-interferência no hit-testing abaixo vale igualmente para `flipX` e para o
  quadro atual da animação.

## Canal de transformação: `angle`, isolado de `scale`/posição

| Canal do sprite | Calculado por | Contrato |
|---|---|---|
| Posição (`setPosition`) | `positionAt()` + `computeRoachTremorOffset()` (specs/008) | Inalterado por esta feature |
| Escala (`setScale`) | `computeRoachSquashStretch()` (specs/008) | Inalterado por esta feature |
| Ângulo (`setAngle`) | `applyRoachHeading()` + `computeRoachLocomotionAngle()` (**novos**) | Introduzido por esta feature |

Nenhuma das três funções lê o resultado das outras duas — cada uma calcula seu canal
independentemente a partir de `roach`/`now`(/`estilo`), e `syncRoachSprites()` só combina os três
resultados na mesma chamada de `sprite.setPosition/setScale/setAngle`. Isso garante que a locomoção
nunca precisa saber do "juice" (e vice-versa) para funcionar corretamente.

## Garantia de não-interferência no hit-testing (FR-005, Princípio V)

Idêntica à já registrada em `specs/008-juice-animacao-barata/contracts/roach-juice-effect.md` §
"Garantia de não-interferência no hit-testing" — `handlePointerDown()`/`CollisionSystem` continuam
lendo exclusivamente `positionAt()`, nunca `sprite.x`/`sprite.y`/`sprite.scaleX`/`sprite.scaleY`
**nem `sprite.angle`** (extensão explícita dessa garantia para o novo canal introduzido aqui).

## Parada no momento da eliminação/roubo (FR-006)

Nenhum código novo é necessário: assim que uma barata sai de `snapshot.activeRoaches` (eliminada via
`playRoachEliminated()`, ou removida pelo roubo de comida), o loop de limpeza de
`syncRoachSprites()` já destrói o sprite e remove a entrada do `Map` de estilo — a partir desse
frame, `computeRoachLocomotionAngle()` simplesmente não é mais chamado para essa barata. O efeito
visual de queda (FR-020 da spec do MVP, `playRoachEliminated()`) assume a apresentação sem
interferência.

## Congelamento na pausa (FR-007)

`computeRoachLocomotionAngle()` recebe `now = this.logicalNow()` — a mesma fonte de tempo corrigida
já usada por `computeRoachSquashStretch`/`computeRoachTremorOffset` (`specs/009-pausar-partida`).
Nenhum código novo de pausa é necessário; o congelamento é herdado automaticamente.

## Chamadores

- **`client/src/scenes/GameScene.ts`** é a única consumidora — `syncRoachSprites()` sorteia/lê o
  estilo do `Map`, chama `computeRoachLocomotionAngle()` e aplica o resultado via
  `sprite.setAngle(...)`, junto aos já existentes `setPosition`/`setScale`.
- Nenhum outro arquivo DEVE ler ou escrever o `Map` de estilo — assim como o "juice", esta é uma
  responsabilidade exclusiva de `GameScene.ts`.
